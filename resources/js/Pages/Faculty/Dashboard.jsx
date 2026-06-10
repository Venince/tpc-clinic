import { Head, Link } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import { CalendarIcon, BeakerIcon, ClockIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

export default function FacultyDashboard({ profile, pendingAppointments, medicineRequests, recentAppointments, announcements }) {
    const statusBadge = (s) => {
        const map = { pending:'badge-yellow', approved:'badge-green', declined:'badge-red', completed:'badge-purple', cancelled:'badge-gray' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    return (
        <FacultyLayout title="Dashboard">
            <Head title="Faculty Dashboard" />

            <div className="bg-gradient-to-r from-clinic-600 to-clinic-700 rounded-xl p-6 text-white mb-6">
                <h2 className="text-xl font-bold">Welcome back! 👋</h2>
                <p className="text-clinic-100 text-sm mt-1">
                    {profile?.department ? `${profile.position || 'Staff'} — ${profile.department}` : 'Complete your profile in Settings.'}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card p-5 text-center">
                    <CalendarIcon className="w-8 h-8 text-clinic-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{pendingAppointments}</p>
                    <p className="text-sm text-gray-500">Pending Appointments</p>
                    <Link href={route('faculty.appointments.index')} className="text-xs text-clinic-600 hover:underline mt-1 block">View all</Link>
                </div>
                <div className="card p-5 text-center">
                    <BeakerIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{medicineRequests}</p>
                    <p className="text-sm text-gray-500">Medicine Requests</p>
                    <Link href={route('faculty.medicine.index')} className="text-xs text-clinic-600 hover:underline mt-1 block">View all</Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Recent Appointments</h3>
                        <Link href={route('faculty.appointments.index')} className="text-xs text-clinic-600 hover:underline">View all</Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentAppointments?.map(a => (
                            <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">{a.purpose}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                        <ClockIcon className="w-3 h-3" /> {a.slot?.date} at {a.slot?.start_time}
                                    </p>
                                </div>
                                {statusBadge(a.status)}
                            </div>
                        ))}
                        {!recentAppointments?.length && <div className="px-6 py-8 text-center text-gray-400 text-sm">No appointments yet.</div>}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <MegaphoneIcon className="w-4 h-4 text-clinic-500" /> Announcements
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {announcements?.map(a => (
                            <div key={a.id} className="px-6 py-3">
                                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(a.published_at).toLocaleDateString()}</p>
                            </div>
                        ))}
                        {!announcements?.length && <div className="px-6 py-8 text-center text-gray-400 text-sm">No announcements.</div>}
                    </div>
                </div>
            </div>
        </FacultyLayout>
    );
}
