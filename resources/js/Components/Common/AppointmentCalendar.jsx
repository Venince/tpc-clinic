import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';

const fmtTime = (raw) => (raw ? String(raw).slice(0, 5) : '—');

const STATUS_DOT = {
    pending:   'bg-yellow-400',
    approved:  'bg-green-500',
    declined:  'bg-red-400',
    completed: 'bg-purple-400',
    cancelled: 'bg-gray-300',
};

const STATUS_BADGE = {
    pending: 'badge-yellow', approved: 'badge-green', declined: 'badge-red',
    completed: 'badge-purple', cancelled: 'badge-gray',
};

/**
 * Read-only appointment calendar for Student / Faculty portals.
 * Shows the signed-in user's own appointments plus any open, bookable slots
 * for the month. Booking and cancelling happen right from the calendar.
 *
 * Props:
 *  - Layout: the portal layout component (StudentLayout / FacultyLayout)
 *  - routePrefix: 'student' | 'faculty' — used to build route names
 *  - appointmentsByDate: { 'YYYY-MM-DD': [{ id, purpose, status, decline_reason, start_time, end_time }] }
 *  - slotsByDate: { 'YYYY-MM-DD': [{ id, start_time, end_time, available_slots, max_appointments }] }
 *  - month: 'YYYY-MM'
 *  - currentDate: 'YYYY-MM-DD'
 *  - holidays: [{ date, name }]
 */
export default function AppointmentCalendar({
    Layout, routePrefix, appointmentsByDate, slotsByDate, month, currentDate, holidays,
}) {
    const [expandedDay, setExpandedDay] = useState(null);
    const [bookDate, setBookDate] = useState(null);       // date string while booking modal is open
    const [confirmCancel, setConfirmCancel] = useState(null); // appointment object

    const calendarRoute = route(`${routePrefix}.appointments.calendar`);
    const indexRoute     = route(`${routePrefix}.appointments.index`);
    const storeRoute     = route(`${routePrefix}.appointments.store`);
    const cancelRoute    = (id) => route(`${routePrefix}.appointments.cancel`, id);

    const { data, setData, post, processing, errors, reset } = useForm({
        appointment_slot_id: '', purpose: '', notes: '',
    });

    const [year, m] = month.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();
    const firstDay = new Date(year, m - 1, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const holidayMap = Object.fromEntries((holidays || []).map(h => [h.date, h.name]));

    const isWeekend = (dateStr) => {
        const day = new Date(dateStr + 'T00:00:00').getDay();
        return day === 0 || day === 6;
    };
    const isUnavailable = (dateStr) => isWeekend(dateStr) || !!holidayMap[dateStr];
    const isPast = (dateStr) => dateStr < currentDate;

    const prevMonth = () => {
        const d = new Date(year, m - 2, 1);
        router.get(calendarRoute, { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
    };
    const nextMonth = () => {
        const d = new Date(year, m, 1);
        router.get(calendarRoute, { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
    };

    const openBookModal = (dateStr, preselectSlotId = '') => {
        reset();
        if (preselectSlotId) setData('appointment_slot_id', String(preselectSlotId));
        setBookDate(dateStr);
    };

    const submitBooking = (e) => {
        e.preventDefault();
        post(storeRoute, { onSuccess: () => { setBookDate(null); reset(); } });
    };

    const cancelAppointment = () => {
        if (!confirmCancel) return;
        router.post(cancelRoute(confirmCancel.id), {}, { onFinish: () => setConfirmCancel(null) });
    };

    const monthName = new Date(year, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const bookDateSlots = bookDate ? (slotsByDate[bookDate] || []) : [];

    return (
        <Layout title="Appointment Calendar">
            <Head title="Appointment Calendar" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <button onClick={prevMonth} className="btn-secondary btn-sm px-2"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <h2 className="font-semibold text-gray-900 text-lg w-40 sm:w-48 text-center">{monthName}</h2>
                    <button onClick={nextMonth} className="btn-secondary btn-sm px-2"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
                <Link href={indexRoute} className="btn-secondary btn-sm justify-center">
                    <ListBulletIcon className="w-4 h-4 mr-1" /> List View
                </Link>
            </div>

            <div className="card overflow-hidden overflow-x-auto">
                <div className="min-w-[640px]">
                    <div className="grid grid-cols-7 border-b border-gray-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {Array(firstDay).fill(null).map((_, i) => (
                            <div key={`empty-${i}`} className="h-24 border-r border-b border-gray-100 bg-gray-50" />
                        ))}
                        {days.map(day => {
                            const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayAppts = appointmentsByDate[dateStr] || [];
                            const daySlots = slotsByDate[dateStr] || [];
                            const availableCount = daySlots.reduce((sum, s) => sum + s.available_slots, 0);
                            const isToday = dateStr === currentDate;
                            const isExpanded = expandedDay === dateStr;
                            const visibleAppts = isExpanded ? dayAppts : dayAppts.slice(0, 2);
                            const unavailable = isUnavailable(dateStr);
                            const canBook = !unavailable && !isPast(dateStr) && availableCount > 0;

                            return (
                                <div
                                    key={day}
                                    className={`min-h-24 border-r border-b border-gray-100 p-1.5 ${isToday ? 'bg-clinic-50' : ''} ${unavailable ? 'bg-gray-100' : ''} ${isExpanded ? 'overflow-visible relative z-10' : 'overflow-hidden'}`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className={`text-xs font-semibold ${isToday ? 'text-clinic-700' : unavailable ? 'text-gray-400' : 'text-gray-600'}`}>{day}</p>
                                        {holidayMap[dateStr] && (
                                            <span className="text-[10px] text-pink-500" title={holidayMap[dateStr]}>●</span>
                                        )}
                                    </div>
                                    <div className={isExpanded ? 'absolute left-0 right-0 bg-white border border-gray-200 rounded shadow-lg p-1.5 z-20' : ''}>
                                        {visibleAppts.map(a => (
                                            <button
                                                key={a.id}
                                                onClick={() => ['pending', 'approved'].includes(a.status) && setConfirmCancel(a)}
                                                title={`${a.purpose} — ${a.status}${a.decline_reason ? ': ' + a.decline_reason : ''}`}
                                                className="w-full flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 mb-0.5 text-left"
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status] || 'bg-gray-300'}`} />
                                                <span className="flex-1 truncate text-gray-700">{fmtTime(a.start_time)} {a.purpose}</span>
                                            </button>
                                        ))}
                                        {!isExpanded && dayAppts.length > 2 && (
                                            <button onClick={() => setExpandedDay(dateStr)} className="text-xs text-clinic-600 hover:underline">
                                                +{dayAppts.length - 2} more
                                            </button>
                                        )}
                                        {isExpanded && (
                                            <button onClick={() => setExpandedDay(null)} className="text-xs text-gray-400 hover:underline mt-1">
                                                Show less
                                            </button>
                                        )}
                                        {canBook && (
                                            <button
                                                onClick={() => openBookModal(dateStr)}
                                                className="text-xs text-clinic-600 hover:underline mt-0.5"
                                            >
                                                {availableCount} slot{availableCount !== 1 ? 's' : ''} open
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" />
                    Weekend / holiday
                </span>
                {Object.entries(STATUS_DOT).map(([status, dot]) => (
                    <span key={status} className="flex items-center gap-1.5 capitalize">
                        <span className={`w-2 h-2 rounded-full inline-block ${dot}`} /> {status}
                    </span>
                ))}
            </div>

            {/* Book modal */}
            {bookDate && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/30 p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Book Appointment — {bookDate}</h3>
                            <button onClick={() => { setBookDate(null); reset(); }} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitBooking} className="space-y-4">
                            <div>
                                <label className="label">Select Time Slot</label>
                                <select value={data.appointment_slot_id} onChange={e => setData('appointment_slot_id', e.target.value)}
                                    className={`input ${errors.appointment_slot_id ? 'input-error' : ''}`}>
                                    <option value="">— Choose a time —</option>
                                    {bookDateSlots.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {fmtTime(s.start_time)}–{fmtTime(s.end_time)} ({s.available_slots} available)
                                        </option>
                                    ))}
                                </select>
                                {errors.appointment_slot_id && <p className="error-msg">{errors.appointment_slot_id}</p>}
                                {errors.slot && <p className="error-msg">{errors.slot}</p>}
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
                                <button type="submit" disabled={processing || !data.appointment_slot_id} className="btn-primary flex-1">
                                    {processing ? 'Booking…' : 'Book Appointment'}
                                </button>
                                <button type="button" onClick={() => { setBookDate(null); reset(); }} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cancel confirmation modal */}
            {confirmCancel && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/30 p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
                        <h3 className="font-semibold text-gray-900 mb-2">Cancel Appointment?</h3>
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">{confirmCancel.purpose}</span> — {fmtTime(confirmCancel.start_time)}–{fmtTime(confirmCancel.end_time)}
                        </p>
                        <p className="text-sm mb-5">
                            Status: <span className={`badge ${STATUS_BADGE[confirmCancel.status] || 'badge-gray'}`}>{confirmCancel.status}</span>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={cancelAppointment} className="btn-danger flex-1 sm:flex-none">Yes, Cancel</button>
                            <button onClick={() => setConfirmCancel(null)} className="btn-secondary flex-1 sm:flex-none">Keep It</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
