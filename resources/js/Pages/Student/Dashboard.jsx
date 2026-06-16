import { Head, Link } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';
import {
    CalendarIcon, BeakerIcon, ClipboardDocumentListIcon,
    DocumentTextIcon, ClockIcon, MegaphoneIcon, ExclamationTriangleIcon,
    ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

export default function StudentDashboard({ profile, profileCompleted, appointmentCount, pendingAppointments, medicineRequests, surveyCompleted, requirementsStatus, recentAppointments, announcements, recentWalkins, walkinCount }) {

    const bothCompleted = profileCompleted && surveyCompleted;

    const statusBadge = (s) => {
        const map = { pending:'badge-yellow', approved:'badge-green', declined:'badge-red', completed:'badge-purple', cancelled:'badge-gray' };
        return <span className={`badge ${map[s] || 'badge-gray'} whitespace-nowrap`}>{s}</span>;
    };

    const formatDate = (dt) => {
        if (!dt) return '—';
        const d = new Date(dt);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dt) => {
        if (!dt) return '';
        return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <StudentLayout title="Dashboard">
            <Head title="Student Dashboard" />

            {/* Gate banner */}
            {!bothCompleted && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800">Action required before using other features</p>
                            <p className="text-sm text-amber-700 mt-0.5">
                                You must complete both your <strong>Profile</strong> and <strong>Health Survey</strong> to book appointments, request medicine, upload requirements, or send messages.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pl-8">
                        {!profileCompleted && (
                            <Link href={route('student.profile')} className="btn-primary btn-sm text-center">
                                Complete Profile
                            </Link>
                        )}
                        {!surveyCompleted && (
                            <Link href={route('student.survey.index')} className="btn-primary btn-sm text-center">
                                Fill out Health Survey
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Welcome */}
            <div className="bg-gradient-to-r from-clinic-600 to-clinic-700 rounded-xl p-4 sm:p-6 text-white mb-4">
                <h2 className="text-lg sm:text-xl font-bold">Welcome back! 👋</h2>
                <p className="text-clinic-100 text-sm mt-1">
                    {profile?.program?.name
                        ? `${profile.program.name} — Year ${profile.year_level ?? '?'}, Block ${profile.block ?? '?'}`
                        : 'Complete your profile to get started.'}
                </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className={`card p-4 text-center ${!bothCompleted ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                    <CalendarIcon className="w-7 h-7 text-clinic-500 mx-auto mb-1.5" />
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{appointmentCount}</p>
                    <p className="text-xs text-gray-500 leading-tight">Total Appointments</p>
                    {pendingAppointments > 0 && <p className="text-xs text-yellow-600 mt-1">{pendingAppointments} pending</p>}
                </div>
                <div className={`card p-4 text-center ${!surveyCompleted ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                    <BeakerIcon className="w-7 h-7 text-purple-500 mx-auto mb-1.5" />
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{medicineRequests}</p>
                    <p className="text-xs text-gray-500 leading-tight">Pending Med Requests</p>
                </div>
                <div className="card p-4 text-center">
                    <ClipboardDocumentListIcon className={`w-7 h-7 mx-auto mb-1.5 ${surveyCompleted ? 'text-green-500' : 'text-amber-400'}`} />
                    <p className={`text-xs sm:text-sm font-semibold leading-tight ${surveyCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                        {surveyCompleted ? 'Survey Done ✓' : 'Survey Required'}
                    </p>
                    {!surveyCompleted && (
                        <Link href={route('student.survey.index')} className="text-xs text-clinic-600 hover:underline mt-1 block">Fill out now</Link>
                    )}
                </div>
                <div className={`card p-4 text-center ${!surveyCompleted ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                    <DocumentTextIcon className="w-7 h-7 text-blue-500 mx-auto mb-1.5" />
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{requirementsStatus?.approved || 0}</p>
                    <p className="text-xs text-gray-500 leading-tight">Requirements Approved</p>
                    {(requirementsStatus?.pending || 0) > 0 && <p className="text-xs text-yellow-600 mt-1">{requirementsStatus.pending} pending</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Announcements */}
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <MegaphoneIcon className="w-4 h-4 text-clinic-500" /> Announcements
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {announcements?.length ? announcements.map(a => (
                            <div key={a.id} className="px-4 sm:px-6 py-3">
                                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(a.published_at).toLocaleDateString()}</p>
                            </div>
                        )) : (
                            <div className="px-6 py-8 text-center text-gray-400 text-sm">No announcements</div>
                        )}
                    </div>
                </div>

                {/* Recent Appointments */}
                <div className={`card ${!bothCompleted ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Recent Appointments</h3>
                        <Link href={route('student.appointments.index')} className="text-xs text-clinic-600 hover:underline">View all</Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentAppointments?.length ? recentAppointments.map(a => (
                            <div key={a.id} className="px-4 sm:px-6 py-3 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{a.purpose}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                        <ClockIcon className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{a.slot?.date} at {a.slot?.start_time}</span>
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

                {/* Walk-in Log */}
                <div className="card lg:col-span-2">
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <ClipboardDocumentCheckIcon className="w-4 h-4 text-clinic-500" />
                            Walk-in History
                            {walkinCount > 0 && (
                                <span className="text-xs bg-clinic-100 text-clinic-700 font-semibold px-2 py-0.5 rounded-full">
                                    {walkinCount} total
                                </span>
                            )}
                        </h3>
                        <Link href={route('student.walkin.index')} className="text-xs text-clinic-600 hover:underline">View all</Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentWalkins?.length ? recentWalkins.map(w => (
                            <div key={w.id} className="px-4 sm:px-6 py-3 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
                                {/* Date */}
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(w.visited_at)}</p>
                                        <p className="text-xs text-gray-400">{formatTime(w.visited_at)}</p>
                                    </div>
                                </div>
                                {/* Complaint & Diagnosis — side by side on mobile */}
                                <div className="grid grid-cols-2 gap-3 sm:contents">
                                    <div>
                                        <p className="text-xs text-gray-500">Chief Complaint</p>
                                        <p className="text-sm text-gray-800 truncate">{w.chief_complaint || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Diagnosis</p>
                                        <p className="text-sm text-gray-800 truncate">{w.diagnosis || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="px-6 py-8 text-center text-gray-400 text-sm">
                                No walk-in records yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
