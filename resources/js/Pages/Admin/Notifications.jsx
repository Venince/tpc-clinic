import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NotificationsPage from '@/Components/Common/NotificationsPage';
import { usePage } from '@inertiajs/react';

export default function AdminNotifications({ notifications }) {
    const { auth } = usePage().props;
    return (
        <>
            <Head title="Notifications" />
            <NotificationsPage
                notifications={notifications}
                notificationsRoute="admin.notifications"
                role={auth.user?.role}
                Layout={AdminLayout}
            />
        </>
    );
}