import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ListBulletIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';

const fmtTime = (raw) => (raw ? String(raw).slice(0, 5) : '—');

const fmtDate = (raw) => {
    if (!raw) return '—';
    const d = new Date(raw + 'T00:00:00');
    if (isNaN(d)) return raw;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

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

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Default appointments landing page for Student / Faculty portals.
 * Mobile-first: the grid only shows day numbers + small status dots so it
 * never needs horizontal scrolling. Tapping any day opens a bottom-sheet
 * with that day's appointments (with cancel) and, for open future days,
 * an inline slot picker + booking form. A "Book Appointment" button is
 * always visible at the top, independent of any specific day, for a quick
 * pick from any open slot.
 *
 * Props:
 *  - Layout: the portal layout component (StudentLayout / FacultyLayout)
 *  - routePrefix: 'student' | 'faculty' — used to build route names
 *  - appointmentsByDate: { 'YYYY-MM-DD': [{ id, purpose, status, decline_reason, start_time, end_time }] }
 *  - slotsByDate: { 'YYYY-MM-DD': [{ id, start_time, end_time, available_slots, max_appointments }] }
 *  - slots: [{ id, date, start_time, end_time, available_slots, max_appointments, booked_count }] — flat, all future open slots
 *  - month: 'YYYY-MM'
 *  - currentDate: 'YYYY-MM-DD'
 *  - holidays: [{ date, name }]
 */
export default function AppointmentCalendar({
    Layout, routePrefix, appointmentsByDate, slotsByDate, slots, month, currentDate, holidays,
}) {
    const [dayDetail, setDayDetail] = useState(null);   // date string of the open day-detail sheet
    const [showQuickBook, setShowQuickBook] = useState(false); // always-available "Book Appointment" modal

    const calendarRoute = route(`${routePrefix}.appointments.index`);
    const listRoute      = route(`${routePrefix}.appointments.list`);
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
    const unavailableReason = (dateStr) => {
        if (isWeekend(dateStr)) return 'Weekends are not available for appointments.';
        if (holidayMap[dateStr]) return `${holidayMap[dateStr]} is a holiday — not available for appointments.`;
        return null;
    };
    const isPast = (dateStr) => dateStr < currentDate;

    const prevMonth = () => {
        const d = new Date(year, m - 2, 1);
        router.get(calendarRoute, { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
    };
    const nextMonth = () => {
        const d = new Date(year, m, 1);
        router.get(calendarRoute, { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
    };

    const openDayDetail = (dateStr) => { reset(); setDayDetail(dateStr); };
    const closeDayDetail = () => { setDayDetail(null); reset(); };
    const openQuickBook = () => { reset(); setShowQuickBook(true); };
    const closeQuickBook = () => { setShowQuickBook(false); reset(); };
    const selectSlot = (id) => setData('appointment_slot_id', String(id));

    const submitDayBooking = (e) => {
        e.preventDefault();
        post(storeRoute, { onSuccess: closeDayDetail });
    };
    const submitQuickBooking = (e) => {
        e.preventDefault();
        post(storeRoute, { onSuccess: closeQuickBook });
    };

    const cancelAppointment = (appointment) => {
        if (!confirm('Cancel this appointment?')) return;
        router.post(cancelRoute(appointment.id));
    };

    const monthName = new Date(year, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <Layout title="Appointment Calendar">
            <Head title="Appointment Calendar" />

            <div className="flex flex-col gap-3 mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-3">
                    <button onClick={prevMonth} className="btn-secondary btn-sm px-2"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <h2 className="font-semibold text-gray-900 text-base sm:text-lg w-36 sm:w-48 text-center">{monthName}</h2>
                    <button onClick={nextMonth} className="btn-secondary btn-sm px-2"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
                {/* Side-by-side on every breakpoint; compact padding/text on mobile, full size from sm+ */}
                <div className="flex flex-row gap-2">
                    <Link
                        href={listRoute}
                        className="btn-secondary justify-center flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                    >
                        <ListBulletIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        List View
                    </Link>
                    <button
                        onClick={openQuickBook}
                        className="btn-primary justify-center flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                    >
                        <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        Book Appointment
                    </button>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-200">
                    {WEEKDAY_LABELS.map((d, i) => (
                        <div key={i} className="py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {Array(firstDay).fill(null).map((_, i) => (
                        <div key={`empty-${i}`} className="h-12 sm:h-20 border-r border-b border-gray-100 bg-gray-50" />
                    ))}
                    {days.map(day => {
                        const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayAppts = appointmentsByDate[dateStr] || [];
                        const daySlots = slotsByDate[dateStr] || [];
                        const availableCount = daySlots.reduce((sum, s) => sum + s.available_slots, 0);
                        const isToday = dateStr === currentDate;
                        const unavailable = isUnavailable(dateStr);
                        const canBook = !unavailable && !isPast(dateStr) && availableCount > 0;
                        const statusesPresent = [...new Set(dayAppts.map(a => a.status))].slice(0, 3);

                        return (
                            <button
                                type="button"
                                key={day}
                                onClick={() => openDayDetail(dateStr)}
                                className={`h-12 sm:h-20 border-r border-b border-gray-100 p-1 sm:p-1.5 flex flex-col items-start text-left transition-colors ${isToday ? 'bg-clinic-50' : unavailable ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className={`text-[10px] sm:text-xs font-semibold ${isToday ? 'text-clinic-700' : unavailable ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {day}
                                    </span>
                                    {holidayMap[dateStr] && <span className="text-[8px] sm:text-[10px] text-pink-500">●</span>}
                                </div>
                                <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 mt-auto">
                                    {statusesPresent.map(status => (
                                        <span key={status} className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-gray-300'}`} />
                                    ))}
                                    {dayAppts.length > 3 && <span className="text-[8px] sm:text-[9px] text-gray-400">+{dayAppts.length - 3}</span>}
                                    {canBook && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-clinic-500 ring-1 ring-clinic-300" title="Slots open" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] sm:text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-gray-100 border border-gray-200 inline-block" />
                    Weekend / holiday
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block bg-clinic-500 ring-1 ring-clinic-300" /> Slots open
                </span>
                {Object.entries(STATUS_DOT).map(([status, dot]) => (
                    <span key={status} className="flex items-center gap-1.5 capitalize">
                        <span className={`w-2 h-2 rounded-full inline-block ${dot}`} /> {status}
                    </span>
                ))}
            </div>

            {/* Always-available quick booking modal — not tied to a specific day */}
            {showQuickBook && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/30 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Book Appointment</h3>
                            <button onClick={closeQuickBook} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitQuickBooking} className="space-y-4">
                            <div>
                                <label htmlFor="quick-book-slot" className="label">Select Slot</label>
                                <select id="quick-book-slot" name="appointment_slot_id" value={data.appointment_slot_id} onChange={e => setData('appointment_slot_id', e.target.value)}
                                    className={`input ${errors.appointment_slot_id ? 'input-error' : ''}`}>
                                    <option value="">— Choose a slot —</option>
                                    {slots.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {fmtDate(s.date)} · {fmtTime(s.start_time)}–{fmtTime(s.end_time)} ({s.available_slots} available)
                                        </option>
                                    ))}
                                </select>
                                {errors.appointment_slot_id && <p className="error-msg">{errors.appointment_slot_id}</p>}
                                {errors.slot && <p className="error-msg">{errors.slot}</p>}
                            </div>
                            <div>
                                <label htmlFor="quick-book-purpose" className="label">Purpose</label>
                                <input id="quick-book-purpose" name="purpose" value={data.purpose} onChange={e => setData('purpose', e.target.value)}
                                    className={`input ${errors.purpose ? 'input-error' : ''}`}
                                    placeholder="e.g. General check-up…" />
                                {errors.purpose && <p className="error-msg">{errors.purpose}</p>}
                            </div>
                            <div>
                                <label htmlFor="quick-book-notes" className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                                <textarea id="quick-book-notes" name="notes" value={data.notes} onChange={e => setData('notes', e.target.value)} className="input" rows={2} />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" disabled={processing} className="btn-primary flex-1">
                                    {processing ? 'Booking…' : 'Book Appointment'}
                                </button>
                                <button type="button" onClick={closeQuickBook} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Day detail sheet — appointments + inline booking scoped to the tapped day */}
            {dayDetail && (() => {
                const dateStr = dayDetail;
                const dayAppts = appointmentsByDate[dateStr] || [];
                const daySlots = slotsByDate[dateStr] || [];
                const unavailable = isUnavailable(dateStr);
                const reason = unavailableReason(dateStr);
                const past = isPast(dateStr);
                const prettyDate = new Date(dateStr + 'T00:00:00')
                    .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

                return (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/30 p-0 sm:p-4">
                        <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl p-6 w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">{prettyDate}</h3>
                                <button onClick={closeDayDetail} className="text-gray-400 hover:text-gray-600">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {dayAppts.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Your Appointments</p>
                                    {dayAppts.map(a => (
                                        <div key={a.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-gray-50">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{a.purpose}</p>
                                                <p className="text-xs text-gray-500">{fmtTime(a.start_time)}–{fmtTime(a.end_time)}</p>
                                                {a.status === 'declined' && a.decline_reason && (
                                                    <p className="text-xs text-red-500 mt-0.5">Reason: {a.decline_reason}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'} whitespace-nowrap`}>{a.status}</span>
                                                {['pending', 'approved'].includes(a.status) && (
                                                    <button onClick={() => cancelAppointment(a)} className="text-xs text-red-500 hover:text-red-700">
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {unavailable ? (
                                <p className="text-sm text-gray-400">{reason}</p>
                            ) : past ? (
                                dayAppts.length === 0 && <p className="text-sm text-gray-400">No appointments on this day.</p>
                            ) : (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Book a Slot</p>
                                    {daySlots.length === 0 ? (
                                        <p className="text-sm text-gray-400">No open slots this day.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {daySlots.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => selectSlot(s.id)}
                                                    className={`w-full text-left p-2.5 rounded-lg border transition-colors ${data.appointment_slot_id === String(s.id) ? 'border-clinic-500 bg-clinic-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    <p className="text-sm font-medium text-gray-900">{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</p>
                                                    <p className="text-xs text-gray-400">{s.available_slots} slot(s) left</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {data.appointment_slot_id && (
                                        <form onSubmit={submitDayBooking} className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                                            <div>
                                                <label htmlFor="day-book-purpose" className="label">Purpose</label>
                                                <input id="day-book-purpose" name="purpose" value={data.purpose} onChange={e => setData('purpose', e.target.value)}
                                                    className={`input ${errors.purpose ? 'input-error' : ''}`}
                                                    placeholder="e.g. General check-up…" />
                                                {errors.purpose && <p className="error-msg">{errors.purpose}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="day-book-notes" className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                                                <textarea id="day-book-notes" name="notes" value={data.notes} onChange={e => setData('notes', e.target.value)} className="input" rows={2} />
                                            </div>
                                            {errors.slot && <p className="error-msg">{errors.slot}</p>}
                                            <div className="flex gap-3">
                                                <button type="submit" disabled={processing} className="btn-primary flex-1">
                                                    {processing ? 'Booking…' : 'Book Appointment'}
                                                </button>
                                                <button type="button" onClick={() => setData('appointment_slot_id', '')} className="btn-secondary">
                                                    Clear
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}
        </Layout>
    );
}
