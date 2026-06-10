import { Head, Link } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';
import {
    CalendarIcon, BeakerIcon, ClipboardDocumentListIcon,
    DocumentTextIcon, ClockIcon, MegaphoneIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function StudentDashboard({ profile, appointmentCount, pendingAppointments, medicineRequests, surveyCompleted, requirementsStatus, recentAppointments, announcements }) {
    const statusBadge = (s) => {
        const map = { pending:'badge-yellow', approved:'badge-green', declined:'badge-red', completed:'badge-purple', cancelled:'badge-gray' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    return (
        <StudentLayout title="Dashboard">
            <Head title="Student Dashboard" />

            {/* Survey gate banner */}
            {!surveyCompleted && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">Health survey required</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                            You must complete the health survey before you can book appointments, request medicine, upload requirements, or send messages.
                        </p>
                    </div>
                    <Link href={route('student.survey.index')} className="btn-primary btn-sm flex-shrink-0">
                        Fill out now
                    </Link>
                </div>
            )}

            {/* Welcome */}
            <div className="bg-gradient-to-r from-clinic-600 to-clinic-700 rounded-xl p-6 text-white mb-6">
                <h2 className="text-xl font-bold">Welcome back! 👋</h2>
                <p className="text-clinic-100 text-sm mt-1">
                    {profile?.program?.name
                        ? `${profile.program.name} — Year ${profile.year_level ?? '?'}, Block ${profile.block ?? '?'}`
                        : 'Complete your profile to get started.'}
                </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className={`card p-4 text-center ${!surveyCompleted ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                    <CalendarIcon className="w-8 h-8 text-clinic-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{appointmentCount}</p>
                    <p className="text-xs text-gray-500">Total Appointments</p>
                    {pendingAppointments > 0 && <p className="text-xs text-yellow-600 mt-1">{pendingAppointments} pending</p>}
                </div>
                <div className={`card p-4 text-center ${!surveyCompleted ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                    <BeakerIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{medicineRequests}</p>
                    <p className="text-xs text-gray-500">Pending Med Requests</p>
                </div>
                <div className="card p-4 text-center">
                    <ClipboardDocumentListIcon className={`w-8 h-8 mx-auto mb-2 ${surveyCompleted ? 'text-green-500' : 'text-amber-400'}`} />
                    <p className={`text-sm font-semibold ${surveyCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                        {surveyCompleted ? 'Survey Done ✓' : 'Survey Required'}
                    </p>
                    {!surveyCompleted && (
                        <Link href={route('student.survey.index')} className="text-xs text-clinic-600 hover:underline">Fill out now</Link>
                    )}
                </div>
                <div className={`card p-4 text-center ${!surveyCompleted ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                    <DocumentTextIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{requirementsStatus?.approved || 0}</p>
                    <p className="text-xs text-gray-500">Requirements Approved</p>
                    {(requirementsStatus?.pending || 0) > 0 && <p className="text-xs text-yellow-600 mt-1">{requirementsStatus.pending} pending</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Appointments */}
                <div className={`card ${!surveyCompleted ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Recent Appointments</h3>
                        <Link href={route('student.appointments.index')} className="text-xs text-clinic-600 hover:underline">View all</Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentAppointments?.length ? recentAppointments.map(a => (
                            <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{a.purpose}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                        <ClockIcon className="w-3 h-3" /> {a.slot?.date} at {a.slot?.start_time}
                                    </p>
                                </div>
                                {statusBadge(a.status)}
                            </div>
                        )) : (
                            <div className="px-6 py-8 text-center text-gray-400 text-sm">
                                No appointments yet.{' '}
                                <Link href={route('student.appointments.index')} className="text-clinic-600 hover:underline">Book one</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Announcements — always visible */}
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <MegaphoneIcon className="w-4 h-4 text-clinic-500" /> Announcements
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {announcements?.length ? announcements.map(a => (
                            <div key={a.id} className="px-6 py-3">
                                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(a.published_at).toLocaleDateString()}</p>
                            </div>
                        )) : (
                            <div className="px-6 py-8 text-center text-gray-400 text-sm">No announcements</div>
                        )}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}