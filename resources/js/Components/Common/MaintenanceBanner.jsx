import { Link, usePage } from '@inertiajs/react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

export function formatExpectedBack(value) {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * variant="admin"  → strip inside the admin layout (admins are never blocked).
 * variant="public" → notice for visitors on the public pages.
 * Renders nothing when maintenance mode is off.
 */
export default function MaintenanceBanner({ variant = 'public' }) {
    const { maintenance } = usePage().props;
    if (!maintenance?.enabled) return null;

    const back = formatExpectedBack(maintenance.ends_at);

    if (variant === 'admin') {
        return (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 sm:px-6 py-2.5 text-sm text-yellow-800 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-2 font-medium">
                    <WrenchScrewdriverIcon className="w-4 h-4 flex-shrink-0" /> Maintenance mode is ON
                </span>
                <span className="text-yellow-700">Students and faculty can't use the portal. Admins are not affected.</span>
                <Link href={route('admin.maintenance.index')} className="font-medium underline sm:ml-auto whitespace-nowrap">
                    Manage
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 md:px-8 py-3 text-sm text-yellow-800 text-center">
            <span className="inline-flex items-center gap-2 font-medium align-middle">
                <WrenchScrewdriverIcon className="w-4 h-4 flex-shrink-0" /> The portal is under maintenance.
            </span>
            {maintenance.message && <span className="break-words"> {maintenance.message}</span>}
            {back && <span> Expected back: {back}.</span>}
        </div>
    );
}
