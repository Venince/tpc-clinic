import { Head } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';
import NotificationsPage from '@/Components/Common/NotificationsPage';

export default function StudentNotifications({ notifications }) {
    return (
        <>
            <Head title="Notifications" />
            <NotificationsPage
                notifications={notifications}
                notificationsRoute="student.notifications"
                role="student"
                Layout={StudentLayout}
            />
        </>
    );
}