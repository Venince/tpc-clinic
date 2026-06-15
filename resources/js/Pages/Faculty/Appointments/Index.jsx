import { Head, router, useForm } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import { useState } from 'react';
import { CalendarIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

const fmtDate = (raw) => {
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
};

const fmtTime = (raw) => {
    if (!raw) return '—';
    return String(raw).slice(0, 5);
};

export default function FacultyAppointments({ appointments, slots }) {
    const [showBook, setShowBook] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ appointment_slot_id: '', purpose: '', notes: '' });

    const submit = (e) => { e.preventDefault(); post(route('faculty.appointments.store'), { onSuccess: () => { setShowBook(false); reset(); } }); };
    const cancel = (id) => { if (confirm('Cancel this appointment?')) router.post(route('faculty.appointments.cancel', id)); };

    const statusBadge = (s) => {
        const map = { pending: 'badge-yellow', approved: 'badge-green', declined: 'badge-red', completed: 'badge-purple', cancelled: 'badge-gray' };
        return <span className={`badge ${map[s] || 'badge-gray'} whitespace-nowrap`}>{s}</span>;
    };

    return (
        <FacultyLayout title="My Appointments">
            <Head title="Appointments" />

            <div className="page-header">
                <div>
                    <h2 className="page-title">Appointments</h2>
                    <p className="page-subtitle">Book and manage your clinic appointments</p>
                </div>
                <button onClick={() => setShowBook(true)} className="btn-primary">
                    <CalendarIcon className="w-4 h-4 mr-2" /> Book Appointment
                </button>
            </div>

            {/* Available slots preview */}
            {slots?.length > 0 && (
                <div className="card mb-4">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900 text-sm">Available Slots</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                        {slots.slice(0, 8).map(slot => (
                            <button key={slot.id} onClick={() => { setData('appointment_slot_id', slot.id); setShowBook(true); }}
                                className="text-left p-3 rounded-lg border border-clinic-200 bg-clinic-50 hover:bg-clinic-100 transition-colors">
                                <p className="text-xs font-semibold text-clinic-700">{fmtDate(slot.date)}</p>
                                <p className="text-xs text-clinic-600 mt-0.5">{fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}</p>
                                <p className="text-xs text-gray-400 mt-1">{slot.available_slots ?? slot.max_appointments - slot.booked_count} slot(s) left</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Mobile card list (hidden on md+) ── */}
            <div className="md:hidden space-y-3">
                {appointments.data.length === 0 && (
                    <div className="card px-6 py-10 text-center text-gray-400 text-sm">
                        No appointments yet.
                    </div>
                )}
                {appointments.data.map(a => (
                    <div key={a.id} className="card p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">{a.purpose}</p>
                            {statusBadge(a.status)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            {fmtDate(a.slot?.date)}
                            <ClockIcon className="w-3.5 h-3.5 flex-shrink-0 ml-2" />
                            {fmtTime(a.slot?.start_time)}
                        </div>
                        {a.status === 'declined' && a.decline_reason && (
                            <p className="text-xs text-red-500">Reason: {a.decline_reason}</p>
                        )}
                        {['pending', 'approved'].includes(a.status) && (
                            <button onClick={() => cancel(a.id)}
                                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 pt-1">
                                <XMarkIcon className="w-3.5 h-3.5" /> Cancel appointment
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Desktop table (hidden on mobile) ── */}
            <div className="card hidden md:block">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Purpose</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.data.map(a => (
                                <tr key={a.id}>
                                    <td className="font-medium">{a.purpose}</td>
                                    <td>{fmtDate(a.slot?.date)}</td>
                                    <td>{fmtTime(a.slot?.start_time)}</td>
                                    <td>
                                        {statusBadge(a.status)}
                                        {a.status === 'declined' && a.decline_reason && (
                                            <p className="text-xs text-red-500 mt-1">{a.decline_reason}</p>
                                        )}
                                    </td>
                                    <td>
                                        {['pending', 'approved'].includes(a.status) && (
                                            <button onClick={() => cancel(a.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                                <XMarkIcon className="w-3.5 h-3.5" /> Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!appointments.data.length && (
                                <tr>
                                    <td colSpan={5} className="text-center text-gray-400 py-8">No appointments yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Book Modal — slides up from bottom on mobile */}
            {showBook && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Book Appointment</h3>
                            <button onClick={() => { setShowBook(false); reset(); }} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="label">Select Slot</label>
                                <select value={data.appointment_slot_id} onChange={e => setData('appointment_slot_id', e.target.value)}
                                    className={`input ${errors.appointment_slot_id ? 'input-error' : ''}`}>
                                    <option value="">— Choose a slot —</option>
                                    {slots.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {fmtDate(s.date)} · {fmtTime(s.start_time)}–{fmtTime(s.end_time)} ({(s.available_slots ?? s.max_appointments - s.booked_count)} available)
                                        </option>
                                    ))}
                                </select>
                                {errors.appointment_slot_id && <p className="error-msg">{errors.appointment_slot_id}</p>}
                            </div>
                            <div>
                                <label className="label">Purpose</label>
                                <input value={data.purpose} onChange={e => setData('purpose', e.target.value)}
                                    className={`input ${errors.purpose ? 'input-error' : ''}`}
                                    placeholder="e.g. General check-up…" />
                                {errors.purpose && <p className="error-msg">{errors.purpose}</p>}
                            </div>
                            <div>
                                <label className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                                <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} className="input" rows={2} />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" disabled={processing} className="btn-primary flex-1">
                                    {processing ? 'Booking…' : 'Book Appointment'}
                                </button>
                                <button type="button" onClick={() => { setShowBook(false); reset(); }} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </FacultyLayout>
    );
}
