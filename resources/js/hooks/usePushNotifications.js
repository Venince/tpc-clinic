import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

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
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isSupported()) return;

        navigator.serviceWorker.register('/sw.js').then(async (registration) => {
            const existing = await registration.pushManager.getSubscription();
            setSubscribed(!!existing);
        }).catch((err) => {
            console.error('SW registration failed:', err);
            setError(err.message);
        });
    }, []);

    const subscribe = useCallback(async () => {
        if (!isSupported()) return;
        setLoading(true);
        setError(null);
        try {
            const registration = await navigator.serviceWorker.ready;

            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== 'granted') return;

            let subscription = await registration.pushManager.getSubscription();

            const trySubscribe = () =>
                registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
                });

            if (!subscription) {
                subscription = await trySubscribe();
            } else {
                // Existing subscription might be stale (old VAPID key, expired, etc.)
                // Verify the server still recognizes it before reusing it.
                try {
                    await axios.post('/push-subscriptions', subscription.toJSON());
                    setSubscribed(true);
                    return;
                } catch {
                    await subscription.unsubscribe();
                    subscription = await trySubscribe();
                }
            }

            await axios.post('/push-subscriptions', subscription.toJSON());
            setSubscribed(true);
        } catch (err) {
            console.error('Push subscribe failed:', err?.response?.data ?? err);
            setError(err?.response?.data?.message ?? err.message ?? 'Failed to enable notifications');
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
        } catch (err) {
            console.error('Unsubscribe failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    return { supported: isSupported(), permission, subscribed, loading, error, subscribe, unsubscribe };
}