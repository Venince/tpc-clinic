import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    UsersIcon, AcademicCapIcon, CalendarIcon, BeakerIcon,
    ExclamationTriangleIcon, HeartIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLORS = { pending: '#f59e0b', approved: '#10b981', declined: '#ef4444', completed: '#6366f1' };
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

function StatCard({ icon: Icon, label, value, sub, color = 'clinic' }) {
    const colors = {
        clinic: 'bg-clinic-50 text-clinic-600',
        green:  'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        red:    'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
    };
    return (
        <div className="stat-card">
            <div className={`stat-icon ${colors[color]}`}><Icon className="w-6 h-6" /></div>
            <div>
                <p className="stat-value">{value?.toLocaleString()}</p>
                <p className="stat-label">{label}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function PregnancyAlert({ students, faculty, counts }) {
    const [open, setOpen] = useState(false);
    const total = counts.students + counts.faculty;

    return (
        <div className="mb-6 rounded-xl border border-pink-200 bg-pink-50 overflow-hidden">
            <button onClick={() => setOpen(o => !o)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-pink-100 transition-colors">
                <div className="flex items-center gap-3">
                    <HeartIcon className="w-5 h-5 text-pink-500 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-pink-800">
                            {total} Pregnant {total === 1 ? 'User' : 'Users'} Recorded
                        </p>
                        <p className="text-xs text-pink-500 mt-0.5">
                            {counts.students} {counts.students === 1 ? 'student' : 'students'},&nbsp;
                            {counts.faculty} {counts.faculty === 1 ? 'faculty/staff' : 'faculty/staff'}
                        </p>
                    </div>
                </div>
                <span className="text-xs text-pink-400">{open ? 'Hide ▲' : 'Show ▼'}</span>
            </button>

            {open && (
                <div className="px-5 pb-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {students?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide mb-2">Students</p>
                            <div className="rounded-lg border border-pink-100 overflow-hidden">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-pink-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-pink-700">Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-pink-700">Program</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-pink-700">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-pink-50">
                                        {students.map((s, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2">
                                                    <p className="font-medium text-gray-900">{s.name}</p>
                                                    <p className="text-xs text-gray-400">{s.email}</p>
                                                </td>
                                                <td className="px-3 py-2 text-gray-500">{s.program}</td>
                                                <td className="px-3 py-2 text-gray-500">{s.due_date || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {faculty?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide mb-2">Faculty / Staff</p>
                            <div className="rounded-lg border border-pink-100 overflow-hidden">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-pink-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-pink-700">Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-pink-700">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-pink-50">
                                        {faculty.map((f, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2">
                                                    <p className="font-medium text-gray-900">{f.name}</p>
                                                    <p className="text-xs text-gray-400">{f.email}</p>
                                                </td>
                                                <td className="px-3 py-2 text-gray-500">{f.due_date || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Dashboard({ stats, appointmentTrend, medicineStock, programDist, recentAppointments }) {
    const statusBadge = (s) => {
        const map = { pending:'badge-yellow', approved:'badge-green', declined:'badge-red', completed:'badge-purple', cancelled:'badge-gray' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatCard icon={UsersIcon}   label="Total Students"      value={stats.total_students}           color="clinic" />
                <StatCard icon={UsersIcon}   label="Total Faculty/Staff" value={stats.total_faculty}            color="purple" />
                <StatCard icon={AcademicCapIcon} label="Active Programs" value={stats.total_programs}           color="green" />
                <StatCard icon={CalendarIcon} label="Appointments Today" value={stats.appointments.today}
                    sub={`${stats.appointments.pending} pending`} color="yellow" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatCard icon={BeakerIcon}           label="Total Medicines"    value={stats.medicine.total}        color="clinic" />
                <StatCard icon={ExclamationTriangleIcon} label="Low Stock"       value={stats.medicine.low_stock}   color="yellow" />
                <StatCard icon={ExclamationTriangleIcon} label="Out of Stock"    value={stats.medicine.out_of_stock} color="red" />
                <StatCard icon={HeartIcon}            label="Pregnant (Students + Faculty)"
                    value={stats.pregnancy.students + stats.pregnancy.faculty}
                    sub={`${stats.pregnancy.students} students, ${stats.pregnancy.faculty} faculty`} color="red" />
            </div>

            {/* Pregnancy Alert */}
            {(stats.pregnancy.students > 0 || stats.pregnancy.faculty > 0) && (
                <PregnancyAlert
                    students={stats.pregnancy.student_list}
                    faculty={stats.pregnancy.faculty_list}
                    counts={stats.pregnancy}
                />
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {/* Appointment trend */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900">Appointment Trends (6 months)</h3>
                    </div>
                    <div className="card-body pt-2">
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={appointmentTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="pending"  stroke="#f59e0b" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="declined" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Medicine stock */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900">Medicine Stock Overview</h3>
                    </div>
                    <div className="card-body pt-2">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={medicineStock} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                                <Tooltip />
                                <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                                    {medicineStock?.map((m, i) => (
                                        <Cell key={i} fill={m.status === 'out' ? '#ef4444' : m.status === 'low' ? '#f59e0b' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Program distribution + Recent appointments */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Students by Program</h3></div>
                    <div className="card-body pt-2 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={programDist} dataKey="total" nameKey="program" cx="50%" cy="50%" outerRadius={70} label={({ program, percent }) => `${program} ${(percent * 100).toFixed(0)}%`}>
                                    {programDist?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card xl:col-span-2">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Recent Appointments</h3></div>
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead><tr>
                                <th>Patient</th><th>Purpose</th><th>Date</th><th>Time</th><th>Status</th>
                            </tr></thead>
                            <tbody>
                                {recentAppointments?.map(a => (
                                    <tr key={a.id}>
                                        <td className="font-medium">{a.patient}</td>
                                        <td className="text-gray-500">{a.purpose}</td>
                                        <td>{a.date}</td>
                                        <td>{a.time}</td>
                                        <td>{statusBadge(a.status)}</td>
                                    </tr>
                                ))}
                                {!recentAppointments?.length && (
                                    <tr><td colSpan={5} className="text-center text-gray-400 py-6">No appointments yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
