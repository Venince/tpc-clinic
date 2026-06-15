import { Head } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip,
} from 'recharts';
import {
    UsersIcon, AcademicCapIcon, CalendarIcon, BeakerIcon,
    ExclamationTriangleIcon, HeartIcon,
} from '@heroicons/react/24/outline';

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
        <div className="stat-card flex-col items-start gap-2 p-3 sm:p-4">
            <div className={`stat-icon ${colors[color]} shrink-0`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 w-full">
                <p className="stat-value text-xl sm:text-2xl leading-tight">{value?.toLocaleString()}</p>
                <p className="stat-label text-xs leading-tight mt-0.5">{label}</p>
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
                className="w-full px-4 sm:px-5 py-4 flex items-center justify-between text-left hover:bg-pink-100 transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <HeartIcon className="w-5 h-5 text-pink-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="font-semibold text-pink-800">{total} Pregnant {total === 1 ? 'User' : 'Users'} Recorded</p>
                        <p className="text-xs text-pink-500 mt-0.5">
                            {counts.students} {counts.students === 1 ? 'student' : 'students'},&nbsp;
                            {counts.faculty} {counts.faculty === 1 ? 'faculty/staff' : 'faculty/staff'}
                        </p>
                    </div>
                </div>
                <span className="text-xs text-pink-400 flex-shrink-0">{open ? 'Hide ▲' : 'Show ▼'}</span>
            </button>
            {open && (
                <div className="px-4 sm:px-5 pb-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {students?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide mb-2">Students</p>
                            <div className="rounded-lg border border-pink-100 overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-pink-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-pink-700 whitespace-nowrap">Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-pink-700 whitespace-nowrap">Program</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-pink-700 whitespace-nowrap">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-pink-50">
                                        {students.map((s, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <p className="font-medium text-gray-900">{s.name}</p>
                                                    <p className="text-xs text-gray-400">{s.email}</p>
                                                </td>
                                                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{s.program}</td>
                                                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{s.due_date || '—'}</td>
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
                            <div className="rounded-lg border border-pink-100 overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-pink-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-pink-700 whitespace-nowrap">Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-pink-700 whitespace-nowrap">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-pink-50">
                                        {faculty.map((f, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <p className="font-medium text-gray-900">{f.name}</p>
                                                    <p className="text-xs text-gray-400">{f.email}</p>
                                                </td>
                                                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{f.due_date || '—'}</td>
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

const tooltipCSS = `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes dotFadeIn { from { opacity: 0; r: 0; } to { opacity: 1; r: 5; } }
@keyframes dotFadeOut { from { opacity: 1; r: 5; } to { opacity: 0; r: 0; } }
@keyframes barFadeIn { from { opacity: 0.2; } to { opacity: 1; } }
@keyframes barFadeOut { from { opacity: 1; } to { opacity: 0.2; } }
`;

function FloatingTooltip({ containerRef, index, data, renderContent, direction = 'horizontal' }) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (!containerRef.current || !data?.length) return;
        const rect = containerRef.current.getBoundingClientRect();

        let x, y;
        if (direction === 'horizontal') {
            const pct = data.length <= 1 ? 0.5 : index / (data.length - 1);
            x = Math.round(pct * (rect.width - 160) + 60);
            y = 10;
        } else {
            const topOffset    = 20;
            const bottomOffset = 20;
            const chartHeight  = rect.height - topOffset - bottomOffset;
            const pct          = data.length <= 1 ? 0.5 : index / (data.length - 1);
            x = rect.width / 2;
            y = Math.round(topOffset + pct * chartHeight);
        }

        const id = Date.now();
        setItems(prev => [
            ...prev.map(item => ({ ...item, fading: true })),
            { id, index, x, y, fading: false },
        ]);

        const cleanup = setTimeout(() => {
            setItems(prev => prev.filter(item => item.id === id));
        }, 1300);

        return () => clearTimeout(cleanup);
    }, [index, data, containerRef, direction]);

    if (!data?.length) return null;

    return (
        <>
            <style>{tooltipCSS}</style>
            {items.map(item => (
                data[item.index] && (
                    <div
                        key={item.id}
                        style={{
                            position:      'absolute',
                            left:           item.x,
                            top:            item.y,
                            transform:     'translateX(-50%)',
                            pointerEvents: 'none',
                            zIndex:         10,
                            animation: `${item.fading ? 'fadeOut' : 'fadeIn'} 1200ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                        }}
                        className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm min-w-[140px]"
                    >
                        {renderContent(data[item.index])}
                    </div>
                )
            ))}
        </>
    );
}

// Mobile-friendly appointment row card
function AppointmentCard({ appointment, statusBadge }) {
    const a = appointment;
    return (
        <div className="p-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-gray-900 text-sm">{a.patient}</p>
                {statusBadge(a.status)}
            </div>
            <p className="text-xs text-gray-500 mb-1">{a.purpose}</p>
            <p className="text-xs text-gray-400">{a.date} · {a.time}</p>
        </div>
    );
}

// Pie chart legend rendered below chart instead of inline labels
function PieLegend({ data }) {
    return (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 px-2">
            {data?.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 truncate max-w-[80px]">{entry.program}</span>
                    <span className="text-xs text-gray-400">
                        {entry.total}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function Dashboard({ stats, appointmentTrend, medicineStock, programDist, recentAppointments }) {
    const statusBadge = (s) => {
        const map = { pending:'badge-yellow', approved:'badge-green', declined:'badge-red', completed:'badge-purple', cancelled:'badge-gray' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    const [trendIndex, setTrendIndex] = useState(0);
    const trendPaused = useRef(false);
    const trendContainerRef = useRef(null);

    useEffect(() => {
        if (!appointmentTrend?.length) return;
        const id = setInterval(() => {
            if (!trendPaused.current)
                setTrendIndex(i => (i + 1) % appointmentTrend.length);
        }, 1800);
        return () => clearInterval(id);
    }, [appointmentTrend]);

    const [stockIndex, setStockIndex] = useState(0);
    const stockPaused = useRef(false);
    const stockContainerRef = useRef(null);

    useEffect(() => {
        if (!medicineStock?.length) return;
        const id = setInterval(() => {
            if (!stockPaused.current)
                setStockIndex(i => (i + 1) % medicineStock.length);
        }, 1800);
        return () => clearInterval(id);
    }, [medicineStock]);

    // Truncate long medicine names on mobile
    const truncateName = (name, maxLen = 12) =>
        name?.length > maxLen ? name.slice(0, maxLen) + '…' : name;

    // Dynamic Y-axis width based on longest medicine name
    const yAxisWidth = medicineStock?.reduce((max, m) => {
        const len = (m.name || '').length;
        return len > max ? len : max;
    }, 0) > 10 ? 90 : 70;

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* Stat cards — 2 cols on all mobile, 4 on xl */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <StatCard icon={UsersIcon}       label="Total Students"      value={stats.total_students}          color="clinic" />
                <StatCard icon={UsersIcon}       label="Total Faculty/Staff" value={stats.total_faculty}           color="purple" />
                <StatCard icon={AcademicCapIcon} label="Active Programs"     value={stats.total_programs}          color="green" />
                <StatCard icon={CalendarIcon}    label="Appointments Today"  value={stats.appointments.today}
                    sub={`${stats.appointments.pending} pending`} color="yellow" />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <StatCard icon={BeakerIcon}              label="Total Medicines" value={stats.medicine.total}         color="clinic" />
                <StatCard icon={ExclamationTriangleIcon} label="Low Stock"       value={stats.medicine.low_stock}    color="yellow" />
                <StatCard icon={ExclamationTriangleIcon} label="Out of Stock"    value={stats.medicine.out_of_stock} color="red" />
                <StatCard icon={HeartIcon}               label="Pregnant"
                    value={stats.pregnancy.students + stats.pregnancy.faculty}
                    sub={`${stats.pregnancy.students}s · ${stats.pregnancy.faculty}f`} color="red" />
            </div>

            {(stats.pregnancy.students > 0 || stats.pregnancy.faculty > 0) && (
                <PregnancyAlert
                    students={stats.pregnancy.student_list}
                    faculty={stats.pregnancy.faculty_list}
                    counts={stats.pregnancy}
                />
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">

                {/* Appointment Trend */}
                <div className="card"
                    onMouseEnter={() => { trendPaused.current = true; }}
                    onMouseLeave={() => { trendPaused.current = false; }}
                >
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Appointment Trends (6 months)</h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="relative" ref={trendContainerRef}>
                            <FloatingTooltip
                                containerRef={trendContainerRef}
                                index={trendIndex}
                                data={appointmentTrend}
                                renderContent={(d) => (
                                    <>
                                        <p className="font-semibold text-gray-700 mb-1">{d.month}</p>
                                        <p style={{ color: '#f59e0b' }}>pending : {d.pending}</p>
                                        <p style={{ color: '#10b981' }}>approved : {d.approved}</p>
                                        <p style={{ color: '#ef4444' }}>declined : {d.declined}</p>
                                    </>
                                )}
                            />
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart
                                    data={appointmentTrend}
                                    margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
                                    onMouseMove={(state) => {
                                        if (trendPaused.current && state?.activeTooltipIndex != null)
                                            setTrendIndex(state.activeTooltipIndex);
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} width={28} />
                                    <Tooltip content={() => null} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    {['pending', 'approved', 'declined'].map((key, ki) => {
                                        const colors = { pending: '#f59e0b', approved: '#10b981', declined: '#ef4444' };
                                        return (
                                            <Line key={key} type="monotone" dataKey={key} stroke={colors[key]} strokeWidth={2}
                                                dot={(props) => {
                                                    const { cx, cy, index } = props;
                                                    const isActive = index === trendIndex;
                                                    return (
                                                        <circle
                                                            key={`${key}-${index}-${isActive}`}
                                                            cx={cx} cy={cy} r={5}
                                                            fill={colors[key]} stroke="#fff" strokeWidth={2}
                                                            style={{
                                                                animation: `${isActive ? 'dotFadeIn' : 'dotFadeOut'} 1200ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                                                            }}
                                                        />
                                                    );
                                                }}
                                                isAnimationActive={false}
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Medicine Stock */}
                <div className="card"
                    onMouseEnter={() => { stockPaused.current = true; }}
                    onMouseLeave={() => { stockPaused.current = false; }}
                >
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Medicine Stock Overview</h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="relative" ref={stockContainerRef}>
                            <FloatingTooltip
                                containerRef={stockContainerRef}
                                index={stockIndex}
                                data={medicineStock}
                                direction="vertical"
                                renderContent={(d) => {
                                    const color = d.status === 'out' ? '#ef4444' : d.status === 'low' ? '#f59e0b' : '#10b981';
                                    return (
                                        <>
                                            <p className="font-semibold text-gray-700 mb-1">{d.name}</p>
                                            <p style={{ color }}>quantity : {d.quantity}</p>
                                        </>
                                    );
                                }}
                            />
                            <ResponsiveContainer width="100%" height={Math.max(200, (medicineStock?.length || 5) * 28)}>
                                <BarChart
                                    data={medicineStock?.map(m => ({ ...m, name: truncateName(m.name) }))}
                                    layout="vertical"
                                    margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
                                    onMouseMove={(state) => {
                                        if (stockPaused.current && state?.activeTooltipIndex != null)
                                            setStockIndex(state.activeTooltipIndex);
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 10 }} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fontSize: 9 }}
                                        width={yAxisWidth}
                                    />
                                    <Tooltip content={() => null} />
                                    <Bar dataKey="quantity" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                                        {medicineStock?.map((m, i) => {
                                            const isActive = i === stockIndex;
                                            const color = m.status === 'out' ? '#ef4444' : m.status === 'low' ? '#f59e0b' : '#10b981';
                                            return (
                                                <Cell
                                                    key={`${i}-${isActive}`}
                                                    fill={color}
                                                    style={{
                                                        animation: `${isActive ? 'barFadeIn' : 'barFadeOut'} 1200ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                                                    }}
                                                />
                                            );
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Program distribution + Recent appointments */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Students by Program</h3>
                    </div>
                    <div className="card-body pt-2">
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={programDist}
                                    dataKey="total"
                                    nameKey="program"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    label={false}
                                >
                                    {programDist?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [value, name]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <PieLegend data={programDist} />
                    </div>
                </div>

                <div className="card xl:col-span-2">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Recent Appointments</h3>
                    </div>

                    {/* Mobile card list — hidden on sm+ */}
                    <div className="sm:hidden">
                        {recentAppointments?.map(a => (
                            <AppointmentCard key={a.id} appointment={a} statusBadge={statusBadge} />
                        ))}
                        {!recentAppointments?.length && (
                            <p className="text-center text-gray-400 py-6 text-sm">No appointments yet</p>
                        )}
                    </div>

                    {/* Table — hidden on mobile */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="table">
                            <thead><tr>
                                <th className="whitespace-nowrap">Patient</th>
                                <th className="whitespace-nowrap">Purpose</th>
                                <th className="whitespace-nowrap">Date</th>
                                <th className="whitespace-nowrap">Time</th>
                                <th className="whitespace-nowrap">Status</th>
                            </tr></thead>
                            <tbody>
                                {recentAppointments?.map(a => (
                                    <tr key={a.id}>
                                        <td className="font-medium whitespace-nowrap">{a.patient}</td>
                                        <td className="text-gray-500 whitespace-nowrap">{a.purpose}</td>
                                        <td className="whitespace-nowrap">{a.date}</td>
                                        <td className="whitespace-nowrap">{a.time}</td>
                                        <td className="whitespace-nowrap">{statusBadge(a.status)}</td>
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
