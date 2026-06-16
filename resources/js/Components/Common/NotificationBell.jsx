import { useState, useRef, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolid } from '@heroicons/react/24/solid';

// Maps notification type + role to the correct route
function resolveUrl(notif, role) {
    if (!role) return null;
    const { type, record_id, conversation_id } = notif.data ?? {};
    const convId  = conversation_id ?? record_id;
    const isAdmin = role === 'admin' || role === 'super_admin';
    const prefix  = isAdmin ? 'admin' : (role === 'faculty_staff' ? 'faculty' : role);

    switch (type) {
        case 'WalkinLogNotification':
            // Deep-link: open walk-in history with the specific log highlighted
            if (record_id) {
                return role === 'faculty_staff'
                    ? route('faculty.walkin.index', { highlight: record_id })
                    : route('student.walkin.index', { highlight: record_id });
            }
            return role === 'faculty_staff'
                ? route('faculty.walkin.index')
                : route('student.walkin.index');

        case 'NewMessageNotification':
            return convId
                ? route(`${prefix}.messages.show`, convId)
                : route(`${prefix}.messages.index`);

        case 'AppointmentStatusNotification':
            return route(`${prefix}.appointments.index`);

        case 'MedicineRequestStatusNotification':
            return isAdmin
                ? route('admin.medicine.requests')
                : route(`${prefix}.medicine.index`);

        case 'NewMedicineRequestNotification':
            return route('admin.medicine.requests');

        case 'LowStockAlertNotification':
            return route('admin.medicine.index');

        case 'RequirementStatusNotification':
            return route(`${prefix}.requirements.index`);

        case 'ReportReadyNotification':
            return route('admin.reports.index');

        default:
            return null;
    }
}

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ notificationsRoute, role }) {
    const { notifications } = usePage().props;
    const [open, setOpen]   = useState(false);
    const ref               = useRef(null);

    const unread = notifications?.unread_count ?? 0;
    const latest = notifications?.latest ?? [];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead = (id) => {
        router.post(route(`${notificationsRoute}.read`, id), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleClick = (notif) => {
        if (!notif.read_at) markRead(notif.id);
        const url = resolveUrl(notif, role);
        setOpen(false);
        if (url) router.visit(url);
    };

    return (
        <div className="relative" ref={ref}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="relative text-gray-500 hover:text-clinic-600 transition-colors p-1"
                aria-label="Notifications"
            >
                {unread > 0
                    ? <BellSolid className="w-6 h-6 text-clinic-600" />
                    : <BellIcon  className="w-6 h-6" />
                }
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <>
                    {/* Mobile backdrop */}
                    <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setOpen(false)} />

                    <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                            {unread > 0 && (
                                <button
                                    onClick={() => router.post(route(`${notificationsRoute}.readAll`), {}, { preserveScroll: true, preserveState: true })}
                                    className="text-xs text-clinic-600 hover:underline"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-gray-50">
                            {latest.length === 0 && (
                                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                    <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                                    No notifications yet.
                                </div>
                            )}
                            {latest.map(notif => {
                                const isNew = !notif.read_at;
                                return (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleClick(notif)}
                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${isNew ? 'bg-clinic-50' : ''}`}
                                    >
                                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${isNew ? 'bg-clinic-500' : 'bg-transparent'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug break-words ${isNew ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                                {notif.data?.message ?? 'New notification'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notif.created_at)}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer — view all */}
                        <div className="border-t border-gray-100 px-4 py-2.5">
                            <Link
                                href={route(notificationsRoute)}
                                onClick={() => setOpen(false)}
                                className="text-xs text-clinic-600 hover:underline font-medium"
                            >
                                View all notifications
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
