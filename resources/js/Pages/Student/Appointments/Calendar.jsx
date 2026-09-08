import StudentLayout from '@/Layouts/StudentLayout';
import AppointmentCalendar from '@/Components/Common/AppointmentCalendar';

export default function StudentAppointmentsCalendar(props) {
    return <AppointmentCalendar Layout={StudentLayout} routePrefix="student" {...props} />;
}
