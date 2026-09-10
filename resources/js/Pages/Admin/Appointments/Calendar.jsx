import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ListBulletIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

const WEEKDAY_FULL  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const fmtTime = (raw) => {
    if (!raw) return '—';
    const [h, m] = String(raw).split(':');
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return raw;
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${period}`;
};

export default function Calendar({ slots, month, currentDate, isSuperAdmin, holidays }) {
    const [dayDetail, setDayDetail] = useState(null);       // date string of the open day-detail sheet
    const [showSlotForm, setShowSlotForm] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null); // holds slot object

    const { data, setData, post, processing, reset, errors } = useForm({
        date: '', start_time: '09:00', end_time: '10:00', max_appointments: 1, notes: '',
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
        if (isWeekend(dateStr)) return 'Weekends are not available for slots.';
        if (holidayMap[dateStr]) return `${holidayMap[dateStr]} is a holiday — not available for slots.`;
        return null;
    };
    const isPast = (dateStr) => dateStr < currentDate;

    const prevMonth = () => {
        const d = new Date(year, m - 2, 1);
        router.get(route('admin.appointments.index'), { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
    };
    const nextMonth = () => {
        const d = new Date(year, m, 1);
        router.get(route('admin.appointments.index'), { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
    };

    const submit = (e) => {
        e.preventDefault();
        if (data.date && isUnavailable(data.date)) return;
        post(route('admin.slots.store'), { onSuccess: () => { setShowSlotForm(false); setDayDetail(null); reset(); } });
    };

    const deleteSlot = () => {
        if (!confirmDelete) return;
        router.delete(route('admin.slots.destroy', confirmDelete.id), {
            onFinish: () => setConfirmDelete(null),
        });
    };

    const openSlotForm = (prefillDate = '') => {
        reset();
        if (prefillDate) setData('date', prefillDate);
        setShowSlotForm(true);
    };

    const openDayDetail = (dateStr) => setDayDetail(dateStr);
    const closeDayDetail = () => setDayDetail(null);

    const monthName = new Date(year, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <AdminLayout title="Appointment Calendar">
            <Head title="Calendar" />

            {/* Header controls — stacked & centered on mobile, row on sm+ */}
            <div className="flex flex-col gap-3 mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-3">
                    <button onClick={prevMonth} className="btn-secondary btn-sm px-2"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <h2 className="font-semibold text-gray-900 text-base sm:text-lg w-36 sm:w-48 text-center">{monthName}</h2>
                    <button onClick={nextMonth} className="btn-secondary btn-sm px-2"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-row gap-2">
                    <Link
                        href={route('admin.appointments.list')}
                        className="btn-secondary justify-center flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                    >
                        <ListBulletIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        List View
                    </Link>
                    <button
                        onClick={() => openSlotForm()}
                        className="btn-primary justify-center flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                    >
                        <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        Add Slot
                    </button>
                </div>
            </div>

            {/* Calendar grid — no horizontal scroll; cells stay compact on every breakpoint */}
            <div className="card overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-200">
                    {WEEKDAY_FULL.map((d, i) => (
                        <div key={d + i} className="py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">
                            <span className="sm:hidden">{WEEKDAY_SHORT[i]}</span>
                            <span className="hidden sm:inline">{d}</span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {Array(firstDay).fill(null).map((_, i) => (
                        <div key={`empty-${i}`} className="h-14 sm:h-24 border-r border-b border-gray-100 bg-gray-50" />
                    ))}
                    {days.map(day => {
                        const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const daySlots = slots[dateStr] || [];
                        const isToday = dateStr === currentDate;
                        const unavailable = isUnavailable(dateStr);
                        const totalBooked = daySlots.reduce((sum, s) => sum + s.pending_count + s.approved_count, 0);

                        return (
                            <button
                                type="button"
                                key={day}
                                onClick={() => openDayDetail(dateStr)}
                                className={`h-14 sm:h-24 border-r border-b border-gray-100 p-1 sm:p-1.5 text-left transition-colors
                                    ${isToday ? 'bg-clinic-50' : unavailable ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <p className={`text-[11px] sm:text-xs font-semibold ${isToday ? 'text-clinic-700' : unavailable ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {day}
                                    </p>
                                    {holidayMap[dateStr] && (
                                        <span className="text-[9px] sm:text-[10px] text-pink-500" title={holidayMap[dateStr]}>●</span>
                                    )}
                                </div>

                                {daySlots.length > 0 && (
                                    <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1">
                                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-medium text-clinic-700 bg-clinic-100 rounded px-1 py-0.5">
                                            {daySlots.length} slot{daySlots.length > 1 ? 's' : ''}
                                        </span>
                                        {/* Booked indicator only shows on sm+, keeps mobile cell minimal */}
                                        {totalBooked > 0 && (
                                            <span className="hidden sm:inline text-[10px] text-gray-400">{totalBooked} booked</span>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" />
                Greyed-out days are weekends or Philippine holidays and are not available for slots.
                <span className="text-pink-500 ml-2">●</span> = holiday
                <span className="ml-2">Tap a day to view or manage its slots.</span>
            </p>

            {/* Day Detail sheet — tap any day to see/manage its slots */}
            {dayDetail && (() => {
                const dateStr = dayDetail;
                const daySlots = slots[dateStr] || [];
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

                            {unavailable && (
                                <p className="text-sm text-gray-400 mb-3">{reason}</p>
                            )}

                            {daySlots.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                    {daySlots.map(slot => (
                                        <div key={slot.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {slot.pending_count + slot.approved_count}/{slot.max_appointments} booked
                                                    {slot.notes ? ` · ${slot.notes}` : ''}
                                                </p>
                                            </div>
                                            {isSuperAdmin && (
                                                <button
                                                    onClick={() => setConfirmDelete(slot)}
                                                    className="shrink-0 text-red-500 hover:text-red-700 p-1"
                                                    title="Delete slot"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                !unavailable && <p className="text-sm text-gray-400 mb-4">No slots created for this day yet.</p>
                            )}

                            {!unavailable && !past && (
                                <button
                                    onClick={() => { setDayDetail(null); openSlotForm(dateStr); }}
                                    className="btn-primary w-full justify-center"
                                >
                                    <PlusIcon className="w-4 h-4 mr-1" /> Add Slot for This Day
                                </button>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Add Slot Modal */}
            {showSlotForm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/30 p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="font-semibold text-gray-900 mb-4">Create Appointment Slot</h3>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label htmlFor="slot-date" className="label">Date</label>
                                <input
                                    id="slot-date"
                                    name="date"
                                    type="date"
                                    value={data.date}
                                    onChange={e => setData('date', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={`input ${(errors.date || (data.date && isUnavailable(data.date))) ? 'input-error' : ''}`}
                                />
                                {errors.date && <p className="error-msg">{errors.date}</p>}
                                {!errors.date && data.date && isUnavailable(data.date) && (
                                    <p className="error-msg">{unavailableReason(data.date)}</p>
                                )}
                            </div>
                            {[
                                { key: 'start_time', label: 'Start Time', type: 'time' },
                                { key: 'end_time', label: 'End Time', type: 'time' },
                                { key: 'max_appointments', label: 'Max Appointments', type: 'number' },
                            ].map(({ key, label, type }) => (
                                <div key={key}>
                                    <label htmlFor={`slot-${key}`} className="label">{label}</label>
                                    <input id={`slot-${key}`} name={key} type={type} value={data[key]} onChange={e => setData(key, e.target.value)}
                                        className={`input ${errors[key] ? 'input-error' : ''}`} min={type === 'number' ? 1 : undefined} />
                                    {errors[key] && <p className="error-msg">{errors[key]}</p>}
                                </div>
                            ))}
                            <div>
                                <label htmlFor="slot-notes" className="label">Notes (optional)</label>
                                <textarea id="slot-notes" name="notes" value={data.notes} onChange={e => setData('notes', e.target.value)} className="input" rows={2} />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing || !data.date || isUnavailable(data.date)}
                                    className="btn-primary flex-1 sm:flex-none"
                                >
                                    {processing ? 'Creating…' : 'Create Slot'}
                                </button>
                                <button type="button" onClick={() => setShowSlotForm(false)} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/30 p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
                        <h3 className="font-semibold text-gray-900 mb-2">Delete Slot?</h3>
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">{confirmDelete.date}</span> — {fmtTime(confirmDelete.start_time)} to {fmtTime(confirmDelete.end_time)}
                        </p>
                        <p className="text-sm text-red-600 mb-5">
                            Slots with active (pending/approved) appointments cannot be deleted.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={deleteSlot} className="btn-danger flex-1 sm:flex-none">Delete</button>
                            <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 sm:flex-none">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}