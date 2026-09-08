import FacultyLayout from '@/Layouts/FacultyLayout';
import AppointmentCalendar from '@/Components/Common/AppointmentCalendar';

export default function FacultyAppointmentsCalendar(props) {
    return <AppointmentCalendar Layout={FacultyLayout} routePrefix="faculty" {...props} />;
}
