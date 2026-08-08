import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

// Converts the VAPID public key (base64url) into the Uint8Array the
// PushManager API expects.
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const isSupported = () =>
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

export default function usePushNotifications() {
    const [permission, setPermission] = useState(isSupported() ? Notification.permission : 'unsupported');
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isSupported()) return;

        navigator.serviceWorker.register('/sw.js').then(async (registration) => {
            const existing = await registration.pushManager.getSubscription();
            setSubscribed(!!existing);
        });
    }, []);

    const subscribe = useCallback(async () => {
        if (!isSupported()) return;
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;

            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== 'granted') return;

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
                });
            }

            await axios.post('/push-subscriptions', subscription.toJSON());
            setSubscribed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const unsubscribe = useCallback(async () => {
        if (!isSupported()) return;
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await axios.delete('/push-subscriptions', { data: { endpoint: subscription.endpoint } });
                await subscription.unsubscribe();
            }
            setSubscribed(false);
        } finally {
            setLoading(false);
        }
    }, []);

    return { supported: isSupported(), permission, subscribed, loading, subscribe, unsubscribe };
}
