import { Head } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import NotificationsPage from '@/Components/Common/NotificationsPage';

export default function FacultyNotifications({ notifications }) {
    return (
        <>
            <Head title="Notifications" />
            <NotificationsPage
                notifications={notifications}
                notificationsRoute="faculty.notifications"
                role="faculty_staff"
                Layout={FacultyLayout}
            />
        </>
    );
}