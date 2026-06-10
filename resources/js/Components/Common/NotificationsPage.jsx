import { router } from '@inertiajs/react';
import { BellIcon } from '@heroicons/react/24/outline';

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
    NewMessageNotification:           'Message',
    AppointmentStatusNotification:    'Appointment',
    MedicineRequestStatusNotification:'Medicine',
    LowStockAlertNotification:        'Low Stock',
    RequirementStatusNotification:    'Requirement',
    ReportReadyNotification:          'Report',
};

const typeBadgeColor = {
    NewMessageNotification:           'bg-blue-100 text-blue-700',
    AppointmentStatusNotification:    'bg-green-100 text-green-700',
    MedicineRequestStatusNotification:'bg-yellow-100 text-yellow-700',
    LowStockAlertNotification:        'bg-red-100 text-red-700',
    RequirementStatusNotification:    'bg-purple-100 text-purple-700',
    ReportReadyNotification:          'bg-gray-100 text-gray-700',
};

export default function NotificationsPage({ notifications, notificationsRoute, role, Layout }) {
    const markRead = (id) => router.post(route(`${notificationsRoute}.read`, id), {}, { preserveScroll: true });
    const markAll  = ()   => router.post(route(`${notificationsRoute}.readAll`));

    const handleClick = (notif) => {
        if (!notif.read_at) markRead(notif.id);
        const url = resolveUrl(notif, role);
        if (url) router.visit(url);
    };

    const items     = notifications?.data ?? [];
    const hasUnread = items.some(n => !n.read_at);

    return (
        <Layout title="Notifications">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Notifications</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Click a notification to go directly to the relevant page.</p>
                </div>
                {hasUnread && (
                    <button onClick={markAll} className="btn-secondary btn-sm">Mark all as read</button>
                )}
            </div>

            <div className="card">
                <div className="divide-y divide-gray-100">
                    {items.length === 0 && (
                        <div className="px-6 py-12 text-center">
                            <BellIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400">No notifications yet.</p>
                        </div>
                    )}
                    {items.map(n => {
                        const type  = n.data?.type;
                        const isNew = !n.read_at;
                        const url   = resolveUrl(n, role);
                        return (
                            <div
                                key={n.id}
                                onClick={() => handleClick(n)}
                                className={`px-6 py-4 flex items-start gap-3 transition-colors ${isNew ? 'bg-clinic-50' : ''} ${url ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                            >
                                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${isNew ? 'bg-clinic-500' : 'bg-transparent border border-gray-200'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {type && (
                                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${typeBadgeColor[type] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {typeLabel[type] ?? type}
                                            </span>
                                        )}
                                        {url && <span className="text-[11px] text-clinic-600">→ tap to open</span>}
                                    </div>
                                    <p className={`text-sm mt-1 ${isNew ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                        {n.data?.message ?? 'New notification'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {new Date(n.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {isNew && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                                        className="text-xs text-clinic-600 hover:underline flex-shrink-0 mt-0.5"
                                    >
                                        Mark read
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
}