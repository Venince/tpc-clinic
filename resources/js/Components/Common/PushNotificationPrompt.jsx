import { useState } from 'react';
import { BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';
import usePushNotifications from '../../hooks/usePushNotifications';

export default function PushNotificationPrompt() {
    const { supported, permission, subscribed, loading, subscribe } = usePushNotifications();
    const [dismissed, setDismissed] = useState(false);

    // Nothing to show if unsupported, already subscribed, previously denied, or dismissed this session
    if (!supported || subscribed || permission === 'denied' || dismissed) return null;

    return (
        <div className="flex items-center gap-3 bg-clinic-50 border border-clinic-100 rounded-lg px-4 py-3 text-sm">
            <BellAlertIcon className="w-5 h-5 text-clinic-600 flex-shrink-0" />
            <p className="flex-1 text-gray-700">
                Get notified about messages, appointments, and announcements — even when this tab is closed.
            </p>
            <button
                onClick={subscribe}
                disabled={loading}
                className="text-clinic-600 font-medium hover:underline disabled:opacity-50 whitespace-nowrap"
            >
                {loading ? 'Enabling…' : 'Enable notifications'}
            </button>
            <button onClick={() => setDismissed(true)} aria-label="Dismiss">
                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
        </div>
    );
}
