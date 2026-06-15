import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import {
    PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon,
    XMarkIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';

function DetailCard({ label, value }) {
    if (!value) return null;
    return (
        <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-sm text-gray-900 whitespace-pre-line">{value}</p>
        </div>
    );
}

export default function WalkinLogIndex({ logs, stats, users, medicines, filters }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth?.user?.role?.name === 'super_admin';

    const [showCreate,       setShowCreate]       = useState(false);
    const [expanded,         setExpanded]         = useState(null);
    const [patientSearch,    setPatientSearch]    = useState('');
    const [showPatientDrop,  setShowPatientDrop]  = useState(false);
    const [search,           setSearch]           = useState(filters?.search    || '');
    const [dateFrom,         setDateFrom]         = useState(filters?.date_from || '');
    const [dateTo,           setDateTo]           = useState(filters?.date_to   || '');
    const [userType,         setUserType]         = useState(filters?.user_type || '');

    const now = new Date();
    const localDT = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id:              '',
        visited_at:           localDT,
        chief_complaint:      '',
        vital_signs: {
            blood_pressure: '', temperature: '',
            pulse_rate: '', o2_saturation: '', weight: '',
        },
        diagnosis:            '',
        treatment:            '',
        medicines_dispensed:  [],
        notes:                '',
    });

    const selectedPatient  = users.find(u => u.id == data.user_id);
    const filteredUsers    = users.filter(u =>
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

    const roleBadge = (role) => (
        <span className={`badge text-[10px] ${role === 'student' ? 'badge-blue' : 'badge-purple'}`}>
            {role === 'student' ? 'Student' : 'Faculty'}
        </span>
    );

    return (
        <AdminLayout title="Walk-in Log">
            <Head title="Walk-in Log" />

            <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                    <h2 className="page-title">Walk-in Log</h2>
                    <p className="page-subtitle">Record and track unscheduled clinic visits</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm whitespace-nowrap">
                    <PlusIcon className="w-4 h-4 mr-1 inline" /> Log Walk-in
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[['Today', stats.today], ['This Month', stats.this_month], ['Total', stats.total]].map(([label, val]) => (
                    <div key={label} className="card p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{val}</p>
                        <p className="text-sm text-gray-500">{label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                        <div className="flex-1 min-w-0">
                            <label className="label">Search</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                    className="input pl-9" placeholder="Search by name or email…" />
                            </div>
                        </div>
                        <div className="flex gap-3 flex-wrap items-end">
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
                            <div className="flex gap-2">
                                <button onClick={applyFilters} className="btn-primary btn-sm">Filter</button>
                                {(search || dateFrom || dateTo || userType) && (
                                    <button onClick={clearFilters} className="btn-secondary btn-sm">Clear</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {logs.data.map(log => (
                    <div key={log.id} className="card">
                        <div className="p-4 flex items-start justify-between cursor-pointer"
                            onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                            <div className="flex items-center gap-3 min-w-0">
                                <UserAvatar user={log.user} size="sm" className="flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">{log.user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{log.chief_complaint}</p>
                                    <p className="text-xs text-gray-300">{new Date(log.visited_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                {roleBadge(log.user?.role?.name)}
                                {expanded === log.id
                                    ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                                    : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                            </div>
                        </div>
                        {expanded === log.id && (
                            <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2 bg-gray-50">
                                {log.vital_signs && Object.values(log.vital_signs).some(Boolean) && (
                                    <div><p className="text-xs text-gray-400">Vital Signs</p><p className="text-sm text-gray-900">{formatVitals(log.vital_signs)}</p></div>
                                )}
                                {log.diagnosis && <div><p className="text-xs text-gray-400">Diagnosis</p><p className="text-sm text-gray-900">{log.diagnosis}</p></div>}
                                {log.treatment && <div><p className="text-xs text-gray-400">Treatment</p><p className="text-sm text-gray-900">{log.treatment}</p></div>}
                                {log.medicines_dispensed?.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-400">Medicines Given</p>
                                        {log.medicines_dispensed.map((m, i) => (
                                            <p key={i} className="text-sm text-gray-900">{m.name} — {m.quantity} {m.unit}</p>
                                        ))}
                                    </div>
                                )}
                                {log.notes && <div><p className="text-xs text-gray-400">Notes</p><p className="text-sm text-gray-900">{log.notes}</p></div>}
                                <p className="text-xs text-gray-300">Logged by {log.logged_by?.name}</p>
                                {isSuperAdmin && (
                                    <button onClick={() => { if (confirm('Delete this log?')) router.delete(route('admin.walkin.destroy', log.id)); }}
                                        className="btn-danger btn-sm mt-1">
                                        <TrashIcon className="w-4 h-4 mr-1 inline" /> Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {!logs.data.length && <div className="card p-8 text-center text-gray-400">No walk-in logs found.</div>}
            </div>

            {/* Desktop */}
            <div className="card hidden md:block">
                <div className="divide-y divide-gray-100">
                    <div className="px-6 py-3 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                        <div className="col-span-3">Patient</div>
                        <div className="col-span-3">Chief Complaint</div>
                        <div className="col-span-3">Vital Signs</div>
                        <div className="col-span-2">Date & Time</div>
                        <div className="col-span-1"></div>
                    </div>
                    {logs.data.map(log => (
                        <div key={log.id}>
                            <div className="px-6 py-4 grid grid-cols-12 gap-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                                <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                                    <UserAvatar user={log.user} size="sm" className="flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">{log.user?.name}</p>
                                        {roleBadge(log.user?.role?.name)}
                                    </div>
                                </div>
                                <div className="col-span-3 flex items-center">
                                    <p className="text-sm text-gray-900 line-clamp-2">{log.chief_complaint}</p>
                                </div>
                                <div className="col-span-3 flex items-center">
                                    <p className="text-xs text-gray-500">{formatVitals(log.vital_signs)}</p>
                                </div>
                                <div className="col-span-2 flex items-center">
                                    <div>
                                        <p className="text-sm text-gray-900">{new Date(log.visited_at).toLocaleDateString()}</p>
                                        <p className="text-xs text-gray-400">{new Date(log.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <div className="col-span-1 flex items-center gap-2 justify-end">
                                    {expanded === log.id ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                                    {isSuperAdmin && (
                                        <button onClick={e => { e.stopPropagation(); if (confirm('Delete this log?')) router.delete(route('admin.walkin.destroy', log.id)); }}
                                            className="text-gray-400 hover:text-red-500">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {expanded === log.id && (
                                <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                                        <DetailCard label="Diagnosis" value={log.diagnosis} />
                                        <DetailCard label="Treatment" value={log.treatment} />
                                        <DetailCard label="Notes" value={log.notes} />
                                        {log.vital_signs && Object.values(log.vital_signs).some(Boolean) && (
                                            <div className="bg-white rounded-lg p-3 border border-gray-100">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Vital Signs</p>
                                                {log.vital_signs.blood_pressure && <p className="text-sm text-gray-900">BP: {log.vital_signs.blood_pressure}</p>}
                                                {log.vital_signs.temperature    && <p className="text-sm text-gray-900">Temp: {log.vital_signs.temperature}°C</p>}
                                                {log.vital_signs.pulse_rate     && <p className="text-sm text-gray-900">Pulse: {log.vital_signs.pulse_rate} bpm</p>}
                                                {log.vital_signs.o2_saturation  && <p className="text-sm text-gray-900">O2 Sat: {log.vital_signs.o2_saturation}%</p>}
                                                {log.vital_signs.weight         && <p className="text-sm text-gray-900">Weight: {log.vital_signs.weight} kg</p>}
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
                                    <p className="text-xs text-gray-400 mt-3">Logged by {log.logged_by?.name}</p>
                                </div>
                            )}
                        </div>
                    ))}
                    {!logs.data.length && (
                        <div className="px-6 py-12 text-center text-gray-400">No walk-in logs found.</div>
                    )}
                </div>
                {logs.links?.length > 3 && (
                    <div className="px-6 py-4 flex flex-wrap justify-center gap-1 border-t border-gray-100">
                        {logs.links.map((link, i) => (
                            <button key={i} disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, { search, date_from: dateFrom, date_to: dateTo, user_type: userType })}
                                className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-clinic-600 text-white' : 'hover:bg-gray-100 text-gray-600'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile Pagination */}
            {logs.links?.length > 3 && (
                <div className="md:hidden flex flex-wrap justify-center gap-1 mt-3">
                    {logs.links.map((link, i) => (
                        <button key={i} disabled={!link.url}
                            onClick={() => link.url && router.get(link.url, { search, date_from: dateFrom, date_to: dateTo, user_type: userType })}
                            className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-clinic-600 text-white' : 'hover:bg-gray-100 text-gray-600'} disabled:opacity-40`}
                            dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}

            {/* Create Modal */}
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
                                            <div key={i} className="flex gap-2 items-center">
                                                <select value={item.medicine_id}
                                                    onChange={e => updateMedicine(i, 'medicine_id', e.target.value)}
                                                    className="input flex-1 text-sm">
                                                    <option value="">— Select medicine —</option>
                                                    {medicines.map(m => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.name} ({m.quantity} {m.unit} available)
                                                        </option>
                                                    ))}
                                                </select>
                                                <input type="number" min="1" value={item.quantity}
                                                    onChange={e => updateMedicine(i, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="input w-20 text-sm" placeholder="Qty" />
                                                <button type="button" onClick={() => removeMedicine(i)}
                                                    className="text-gray-400 hover:text-red-500 flex-shrink-0">
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
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