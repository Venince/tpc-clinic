import { router } from '@inertiajs/react';
import { BellIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';

function resolveUrl(notif, role) {
    const { type, record_id, conversation_id } = notif.data ?? {};
    const convId  = conversation_id ?? record_id;
    const isAdmin = role === 'admin' || role === 'super_admin';
    const prefix  = isAdmin ? 'admin' : (role === 'faculty_staff' ? 'faculty' : role);

    switch (type) {
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

const typeLabel = {
    NewMessageNotification:            'Message',
    AppointmentStatusNotification:     'Appointment',
    MedicineRequestStatusNotification: 'Medicine',
    LowStockAlertNotification:         'Low Stock',
    RequirementStatusNotification:     'Requirement',
    ReportReadyNotification:           'Report',
};

const typeBadgeColor = {
    NewMessageNotification:            'bg-blue-100 text-blue-700',
    AppointmentStatusNotification:     'bg-green-100 text-green-700',
    MedicineRequestStatusNotification: 'bg-yellow-100 text-yellow-700',
    LowStockAlertNotification:         'bg-red-100 text-red-700',
    RequirementStatusNotification:     'bg-purple-100 text-purple-700',
    ReportReadyNotification:           'bg-gray-100 text-gray-700',
};

export default function NotificationsPage({ notifications, notificationsRoute, role, Layout }) {
    const markRead  = (id) => router.post(route(`${notificationsRoute}.read`, id), {}, { preserveScroll: true });
    const markAll   = ()   => router.post(route(`${notificationsRoute}.readAll`));
    const deleteOne = (id) => router.delete(route(`${notificationsRoute}.destroy`, id), {}, { preserveScroll: true });
    const deleteAll = ()   => router.delete(route(`${notificationsRoute}.destroyAll`));

    const handleClick = (notif) => {
        if (!notif.read_at) markRead(notif.id);
        const url = resolveUrl(notif, role);
        if (url) router.visit(url);
    };

    const items     = notifications?.data ?? [];
    const hasUnread = items.some(n => !n.read_at);

    return (
        <Layout title="Notifications">
            {/* ── Page header ── */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Notifications</h2>
                    <p className="page-subtitle">Tap a notification to go to the relevant page.</p>
                </div>

                {items.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:ml-auto">
                        {hasUnread && (
                            <button
                                onClick={markAll}
                                className="btn-secondary btn-sm flex-1 sm:flex-none justify-center"
                            >
                                <CheckIcon className="w-4 h-4 mr-1" />
                                Mark all read
                            </button>
                        )}
                        <button
                            onClick={() => { if (confirm('Delete all notifications?')) deleteAll(); }}
                            className="btn-sm flex items-center justify-center gap-1.5 text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex-1 sm:flex-none"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Delete all
                        </button>
                    </div>
                )}
            </div>

            {/* ── List ── */}
            <div className="card">
                <div className="divide-y divide-gray-100">
                    {items.length === 0 && (
                        <div className="px-6 py-14 text-center">
                            <BellIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400">No notifications yet.</p>
                        </div>
                    )}

                    {items.map(n => {
                        const type   = n.data?.type;
                        const isNew  = !n.read_at;
                        const url    = resolveUrl(n, role);
                        // Sender info optionally embedded in notification data
                        const sender = n.data?.sender ?? null;

                        return (
                            <div
                                key={n.id}
                                className={`px-4 sm:px-6 py-4 transition-colors ${isNew ? 'bg-clinic-50' : ''} ${url ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}`}
                                onClick={() => handleClick(n)}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Sender avatar or unread dot */}
                                    {sender ? (
                                        <UserAvatar user={sender} size="sm" className="mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <span className={`mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0 ${isNew ? 'bg-clinic-500' : 'bg-transparent border border-gray-200'}`} />
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Badge + unread dot (when avatar replaces the dot) */}
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            {sender && isNew && (
                                                <span className="w-2 h-2 rounded-full bg-clinic-500 flex-shrink-0" />
                                            )}
                                            {type && (
                                                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${typeBadgeColor[type] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {typeLabel[type] ?? type}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {new Date(n.created_at).toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Message */}
                                        <p className={`text-sm break-words leading-snug ${isNew ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                            {n.data?.message ?? 'New notification'}
                                        </p>

                                        {/* Mobile action row */}
                                        <div className="flex items-center gap-3 mt-2 sm:hidden">
                                            {isNew && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                                                    className="flex items-center gap-1 text-xs text-clinic-600 font-medium py-1"
                                                >
                                                    <CheckIcon className="w-3.5 h-3.5" />
                                                    Mark read
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}
                                                className="flex items-center gap-1 text-xs text-red-500 font-medium py-1 ml-auto"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Desktop action column */}
                                    <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0 mt-0.5">
                                        {isNew && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                                                className="text-xs text-clinic-600 hover:underline whitespace-nowrap"
                                            >
                                                Mark read
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                            title="Delete notification"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
}
