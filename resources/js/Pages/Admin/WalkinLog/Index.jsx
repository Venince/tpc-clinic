import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import {
    PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon,
    XMarkIcon, MagnifyingGlassIcon, FunnelIcon, HeartIcon, BeakerIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';

/* ── small reusable bits ── */
function VitalPill({ label, value }) {
    if (!value) return null;
    return (
        <span className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-xs text-gray-700">
            <span className="text-gray-400 font-medium">{label}</span>
            <span className="font-semibold text-gray-900">{value}</span>
        </span>
    );
}

function DetailCard({ label, value }) {
    if (!value) return null;
    return (
        <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-sm text-gray-900 whitespace-pre-line">{value}</p>
        </div>
    );
}

function RoleBadge({ role }) {
    return (
        <span className={`badge text-[10px] ${role === 'student' ? 'badge-blue' : 'badge-purple'}`}>
            {role === 'student' ? 'Student' : 'Faculty'}
        </span>
    );
}

/* ── main component ── */
export default function WalkinLogIndex({ logs, stats, users, medicines, filters }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth?.user?.role?.name === 'super_admin';

    const [showCreate,      setShowCreate]      = useState(false);
    const [expanded,        setExpanded]        = useState(null);
    const [showFilters,     setShowFilters]     = useState(false);
    const [patientSearch,   setPatientSearch]   = useState('');
    const [showPatientDrop, setShowPatientDrop] = useState(false);
    const [search,          setSearch]          = useState(filters?.search    || '');
    const [dateFrom,        setDateFrom]        = useState(filters?.date_from || '');
    const [dateTo,          setDateTo]          = useState(filters?.date_to   || '');
    const [userType,        setUserType]        = useState(filters?.user_type || '');

    const hasActiveFilters = search || dateFrom || dateTo || userType;

    const now = new Date();
    const localDT = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '', visited_at: localDT, chief_complaint: '',
        vital_signs: { blood_pressure: '', temperature: '', pulse_rate: '', o2_saturation: '', weight: '' },
        diagnosis: '', treatment: '', medicines_dispensed: [], notes: '',
    });

    const selectedPatient = users.find(u => u.id == data.user_id);
    const filteredUsers   = users.filter(u =>
        u.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(patientSearch.toLowerCase())
    ).slice(0, 8);

    const addMedicine    = () => setData('medicines_dispensed', [...data.medicines_dispensed, { medicine_id: '', quantity: 1 }]);
    const updateMedicine = (i, field, val) => {
        const updated = [...data.medicines_dispensed];
        updated[i] = { ...updated[i], [field]: val };
        setData('medicines_dispensed', updated);
    };
    const removeMedicine = (i) => setData('medicines_dispensed', data.medicines_dispensed.filter((_, idx) => idx !== i));

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.walkin.store'), {
            onSuccess: () => { setShowCreate(false); reset(); setPatientSearch(''); },
        });
    };

    const applyFilters = () => router.get(route('admin.walkin.index'), {
        search, date_from: dateFrom, date_to: dateTo, user_type: userType,
    }, { preserveState: true });

    const clearFilters = () => {
        setSearch(''); setDateFrom(''); setDateTo(''); setUserType('');
        router.get(route('admin.walkin.index'));
    };

    const formatVitals = (vs) => {
        if (!vs) return '—';
        const parts = [];
        if (vs.blood_pressure) parts.push(`BP: ${vs.blood_pressure}`);
        if (vs.temperature)    parts.push(`Temp: ${vs.temperature}°C`);
        if (vs.pulse_rate)     parts.push(`Pulse: ${vs.pulse_rate} bpm`);
        if (vs.o2_saturation)  parts.push(`O2: ${vs.o2_saturation}%`);
        if (vs.weight)         parts.push(`Wt: ${vs.weight} kg`);
        return parts.join(' · ') || '—';
    };

    const hasVitals = (vs) => vs && Object.values(vs).some(Boolean);

    const formatDate = (dt) => new Date(dt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    const formatTime = (dt) => new Date(dt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

    const paginationButtons = (extraParams = {}) =>
        logs.links?.length > 3 && (
            <div className="flex flex-wrap justify-center gap-1 py-3 px-4">
                {logs.links.map((link, i) => (
                    <button key={i} disabled={!link.url}
                        onClick={() => link.url && router.get(link.url, { search, date_from: dateFrom, date_to: dateTo, user_type: userType, ...extraParams })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            link.active ? 'bg-clinic-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
            </div>
        );

    return (
        <AdminLayout title="Walk-in Log">
            <Head title="Walk-in Log" />

            {/* ── Page header ── */}
            <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                    <h2 className="page-title">Walk-in Log</h2>
                    <p className="page-subtitle">Record and track unscheduled clinic visits</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm whitespace-nowrap flex-shrink-0">
                    <PlusIcon className="w-4 h-4 mr-1 inline" />
                    <span className="hidden sm:inline">Log Walk-in</span>
                    <span className="sm:hidden">Log</span>
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                {[['Today', stats.today], ['This Month', stats.this_month], ['Total', stats.total]].map(([label, val]) => (
                    <div key={label} className="card p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{val}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="card mb-4">
                {/* Filter toggle header (mobile) */}
                <button
                    type="button"
                    onClick={() => setShowFilters(v => !v)}
                    className="sm:hidden w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
                >
                    <span className="flex items-center gap-2">
                        <FunnelIcon className="w-4 h-4 text-gray-400" />
                        Filters
                        {hasActiveFilters && (
                            <span className="bg-clinic-600 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5">
                                ON
                            </span>
                        )}
                    </span>
                    {showFilters
                        ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                        : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                </button>

                <div className={`px-4 pb-4 pt-3 sm:block ${showFilters ? 'block' : 'hidden sm:block'}`}>
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
                        {/* Search */}
                        <div className="sm:flex-1 sm:min-w-0">
                            <label className="label">Search</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                    className="input pl-9" placeholder="Search by name or email…" />
                            </div>
                        </div>

                        {/* Date range + type — 2-col grid on mobile */}
                        <div className="grid grid-cols-2 sm:flex gap-3 sm:items-end">
                            <div>
                                <label className="label">From</label>
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" />
                            </div>
                            <div>
                                <label className="label">To</label>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" />
                            </div>
                            <div>
                                <label className="label">Type</label>
                                <select value={userType} onChange={e => setUserType(e.target.value)} className="input">
                                    <option value="">All</option>
                                    <option value="student">Student</option>
                                    <option value="faculty_staff">Faculty/Staff</option>
                                </select>
                            </div>
                            <div className="flex gap-2 items-end">
                                <button onClick={applyFilters} className="btn-primary btn-sm flex-1 sm:flex-none">Filter</button>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="btn-secondary btn-sm">Clear</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Log list — unified card approach (mobile-first, table on lg+) ── */}

            {/* Mobile + Tablet cards (hidden on lg) */}
            <div className="lg:hidden space-y-3">
                {logs.data.map(log => {
                    const isOpen = expanded === log.id;
                    const vs = log.vital_signs;
                    return (
                        <div key={log.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <button
                                type="button"
                                className="w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none"
                                onClick={() => setExpanded(isOpen ? null : log.id)}
                                aria-expanded={isOpen}
                            >
                                <UserAvatar user={log.user} size="sm" className="flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm text-gray-900 truncate">{log.user?.name}</p>
                                        <RoleBadge role={log.user?.role?.name} />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{log.chief_complaint}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-400">{formatDate(log.visited_at)}</span>
                                        <span className="text-xs text-gray-300">·</span>
                                        <span className="text-xs text-gray-400">{formatTime(log.visited_at)}</span>
                                    </div>
                                    {!isOpen && hasVitals(vs) && (
                                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                            <HeartIcon className="w-3 h-3" /> Vitals recorded
                                        </p>
                                    )}
                                </div>
                                <span className="flex-shrink-0 mt-1">
                                    {isOpen
                                        ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                                        : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                                </span>
                            </button>

                            {isOpen && (
                                <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
                                    {hasVitals(vs) && (
                                        <div>
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-2">Vital Signs</p>
                                            <div className="flex flex-wrap gap-2">
                                                <VitalPill label="BP"    value={vs.blood_pressure} />
                                                <VitalPill label="Temp"  value={vs.temperature ? `${vs.temperature}°C` : null} />
                                                <VitalPill label="Pulse" value={vs.pulse_rate ? `${vs.pulse_rate} bpm` : null} />
                                                <VitalPill label="O2"    value={vs.o2_saturation ? `${vs.o2_saturation}%` : null} />
                                                <VitalPill label="Wt"    value={vs.weight ? `${vs.weight} kg` : null} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {log.diagnosis && <DetailCard label="Diagnosis" value={log.diagnosis} />}
                                        {log.treatment && <DetailCard label="Treatment" value={log.treatment} />}
                                        {log.notes     && <DetailCard label="Notes"     value={log.notes} />}
                                    </div>

                                    {log.medicines_dispensed?.length > 0 && (
                                        <div>
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1">
                                                <BeakerIcon className="w-3 h-3" /> Medicines Given
                                            </p>
                                            <div className="space-y-1.5">
                                                {log.medicines_dispensed.map((m, i) => (
                                                    <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                                                        <span className="text-sm text-gray-900 font-medium">{m.name}</span>
                                                        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{m.quantity} {m.unit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] text-gray-400">
                                            Logged by <span className="font-medium">{log.logged_by?.name}</span>
                                        </p>
                                        {isSuperAdmin && (
                                            <button
                                                onClick={() => { if (confirm('Delete this log?')) router.delete(route('admin.walkin.destroy', log.id)); }}
                                                className="btn-danger btn-sm text-xs">
                                                <TrashIcon className="w-3.5 h-3.5 mr-1 inline" /> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {!logs.data.length && (
                    <div className="bg-white rounded-xl border border-dashed border-gray-200 px-6 py-14 text-center">
                        <p className="text-sm font-medium text-gray-400">No walk-in logs found.</p>
                    </div>
                )}
                {paginationButtons()}
            </div>

            {/* ── Desktop table (lg+) ── */}
            <div className="card hidden lg:block">
                <div className="divide-y divide-gray-100">
                    {/* Table header */}
                    <div className="px-6 py-3 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                        <div className="col-span-3">Patient</div>
                        <div className="col-span-3">Chief Complaint</div>
                        <div className="col-span-3">Vital Signs</div>
                        <div className="col-span-2">Date & Time</div>
                        <div className="col-span-1"></div>
                    </div>

                    {logs.data.map(log => {
                        const isOpen = expanded === log.id;
                        const vs = log.vital_signs;
                        return (
                            <div key={log.id}>
                                <div
                                    className="px-6 py-4 grid grid-cols-12 gap-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setExpanded(isOpen ? null : log.id)}
                                >
                                    <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                                        <UserAvatar user={log.user} size="sm" className="flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">{log.user?.name}</p>
                                            <RoleBadge role={log.user?.role?.name} />
                                        </div>
                                    </div>
                                    <div className="col-span-3 flex items-center">
                                        <p className="text-sm text-gray-900 line-clamp-2">{log.chief_complaint}</p>
                                    </div>
                                    <div className="col-span-3 flex items-center">
                                        <p className="text-xs text-gray-500">{formatVitals(vs)}</p>
                                    </div>
                                    <div className="col-span-2 flex items-center">
                                        <div>
                                            <p className="text-sm text-gray-900">{formatDate(log.visited_at)}</p>
                                            <p className="text-xs text-gray-400">{formatTime(log.visited_at)}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-1 flex items-center gap-2 justify-end">
                                        {isOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                                        {isSuperAdmin && (
                                            <button onClick={e => { e.stopPropagation(); if (confirm('Delete this log?')) router.delete(route('admin.walkin.destroy', log.id)); }}
                                                className="text-gray-400 hover:text-red-500">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
                                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 pt-3">
                                            <DetailCard label="Diagnosis" value={log.diagnosis} />
                                            <DetailCard label="Treatment" value={log.treatment} />
                                            <DetailCard label="Notes"     value={log.notes} />
                                            {hasVitals(vs) && (
                                                <div className="bg-white rounded-lg p-3 border border-gray-100">
                                                    <p className="text-xs font-medium text-gray-500 mb-2">Vital Signs</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <VitalPill label="BP"    value={vs.blood_pressure} />
                                                        <VitalPill label="Temp"  value={vs.temperature ? `${vs.temperature}°C` : null} />
                                                        <VitalPill label="Pulse" value={vs.pulse_rate ? `${vs.pulse_rate} bpm` : null} />
                                                        <VitalPill label="O2"    value={vs.o2_saturation ? `${vs.o2_saturation}%` : null} />
                                                        <VitalPill label="Wt"    value={vs.weight ? `${vs.weight} kg` : null} />
                                                    </div>
                                                </div>
                                            )}
                                            {log.medicines_dispensed?.length > 0 && (
                                                <div className="bg-white rounded-lg p-3 border border-gray-100">
                                                    <p className="text-xs font-medium text-gray-500 mb-1">Medicines Dispensed</p>
                                                    {log.medicines_dispensed.map((m, i) => (
                                                        <p key={i} className="text-sm text-gray-900">{m.name} — {m.quantity} {m.unit}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-3">
                                            Logged by <span className="font-medium">{log.logged_by?.name}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {!logs.data.length && (
                        <div className="px-6 py-12 text-center text-gray-400">No walk-in logs found.</div>
                    )}
                </div>
                {paginationButtons()}
            </div>

            {/* ── Create Modal ── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/30 p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl shadow-xl max-h-[95vh] flex flex-col">
                        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
                            <h3 className="font-semibold text-gray-900">Log Walk-in Visit</h3>
                            <button onClick={() => { setShowCreate(false); reset(); setPatientSearch(''); }}
                                className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="overflow-y-auto flex-1 p-5 space-y-4">

                                {/* Patient */}
                                <div>
                                    <label className="label">Patient <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            value={selectedPatient ? `${selectedPatient.name} (${selectedPatient.email})` : patientSearch}
                                            onChange={e => { setPatientSearch(e.target.value); setData('user_id', ''); setShowPatientDrop(true); }}
                                            onFocus={() => setShowPatientDrop(true)}
                                            onBlur={() => setTimeout(() => setShowPatientDrop(false), 150)}
                                            className={`input ${errors.user_id ? 'input-error' : ''}`}
                                            placeholder="Search by name or email…"
                                        />
                                        {showPatientDrop && !selectedPatient && filteredUsers.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                                {filteredUsers.map(u => (
                                                    <button key={u.id} type="button"
                                                        onMouseDown={() => { setData('user_id', u.id); setShowPatientDrop(false); }}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                                        <p className="text-xs text-gray-400">{u.email} · {u.role === 'student' ? 'Student' : 'Faculty/Staff'}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {errors.user_id && <p className="error-msg">{errors.user_id}</p>}
                                </div>

                                {/* Date & Time */}
                                <div>
                                    <label className="label">Visit Date & Time <span className="text-red-500">*</span></label>
                                    <input type="datetime-local" value={data.visited_at}
                                        onChange={e => setData('visited_at', e.target.value)}
                                        className={`input ${errors.visited_at ? 'input-error' : ''}`} />
                                    {errors.visited_at && <p className="error-msg">{errors.visited_at}</p>}
                                </div>

                                {/* Chief Complaint */}
                                <div>
                                    <label className="label">Chief Complaint <span className="text-red-500">*</span></label>
                                    <input value={data.chief_complaint}
                                        onChange={e => setData('chief_complaint', e.target.value)}
                                        className={`input ${errors.chief_complaint ? 'input-error' : ''}`}
                                        placeholder="e.g. Headache, Fever, Wound dressing" />
                                    {errors.chief_complaint && <p className="error-msg">{errors.chief_complaint}</p>}
                                </div>

                                {/* Vital Signs */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-3">
                                        Vital Signs <span className="text-xs text-gray-400 font-normal">(optional)</span>
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[
                                            { key: 'blood_pressure', label: 'Blood Pressure',    placeholder: 'e.g. 120/80' },
                                            { key: 'temperature',    label: 'Temperature (°C)',  placeholder: 'e.g. 36.5' },
                                            { key: 'pulse_rate',     label: 'Pulse Rate (bpm)',  placeholder: 'e.g. 72' },
                                            { key: 'o2_saturation',  label: 'O2 Saturation (%)', placeholder: 'e.g. 98' },
                                            { key: 'weight',         label: 'Weight (kg)',        placeholder: 'e.g. 55' },
                                        ].map(v => (
                                            <div key={v.key}>
                                                <label className="label text-xs">{v.label}</label>
                                                <input
                                                    value={data.vital_signs[v.key] || ''}
                                                    onChange={e => setData('vital_signs', { ...data.vital_signs, [v.key]: e.target.value })}
                                                    className="input text-sm" placeholder={v.placeholder} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Diagnosis & Treatment */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Diagnosis <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
                                        <textarea value={data.diagnosis} onChange={e => setData('diagnosis', e.target.value)}
                                            className="input" rows={2} placeholder="e.g. Upper respiratory tract infection" />
                                    </div>
                                    <div>
                                        <label className="label">Treatment / Action <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
                                        <textarea value={data.treatment} onChange={e => setData('treatment', e.target.value)}
                                            className="input" rows={2} placeholder="e.g. Rest advised. Paracetamol given." />
                                    </div>
                                </div>

                                {/* Medicines Dispensed */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="label mb-0">
                                            Medicines Dispensed <span className="text-xs text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <button type="button" onClick={addMedicine} className="btn-secondary btn-sm text-xs">
                                            + Add Medicine
                                        </button>
                                    </div>
                                    {errors.medicines_dispensed && <p className="error-msg mb-2">{errors.medicines_dispensed}</p>}
                                    {data.medicines_dispensed.length === 0 && (
                                        <p className="text-xs text-gray-400 italic">No medicines added.</p>
                                    )}
                                    <div className="space-y-2">
                                        {data.medicines_dispensed.map((item, i) => (
                                            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2.5 bg-gray-50">
                                                {/* Medicine select + remove */}
                                                <div className="flex items-center gap-2">
                                                    <select value={item.medicine_id}
                                                        onChange={e => updateMedicine(i, 'medicine_id', e.target.value)}
                                                        className="input flex-1 text-sm min-w-0">
                                                        <option value="">— Select medicine —</option>
                                                        {medicines.map(m => (
                                                            <option key={m.id} value={m.id}>
                                                                {m.name} ({m.quantity} {m.unit} available)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button type="button" onClick={() => removeMedicine(i)}
                                                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Quantity stepper */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 font-medium">Quantity</span>
                                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateMedicine(i, 'quantity', Math.max(1, (item.quantity || 1) - 1))}
                                                            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors text-lg font-medium select-none"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-10 text-center text-sm font-semibold text-gray-900 select-none">
                                                            {item.quantity || 1}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateMedicine(i, 'quantity', (item.quantity || 1) + 1)}
                                                            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors text-lg font-medium select-none"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="label">Notes <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
                                    <textarea value={data.notes} onChange={e => setData('notes', e.target.value)}
                                        className="input" rows={2} placeholder="Any additional notes…" />
                                </div>
                            </div>

                            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex-shrink-0">
                                <button type="submit"
                                    disabled={processing || !data.user_id || !data.chief_complaint}
                                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {processing ? 'Saving…' : 'Save Walk-in Log'}
                                </button>
                                <button type="button"
                                    onClick={() => { setShowCreate(false); reset(); setPatientSearch(''); }}
                                    className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
