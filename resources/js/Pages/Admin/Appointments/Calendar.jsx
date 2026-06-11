import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Calendar({ slots, month, currentDate, isSuperAdmin, holidays }) {
    const [expandedDay, setExpandedDay] = useState(null);
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

    const prevMonth = () => {
        const d = new Date(year, m - 2, 1);
        router.get(route('admin.appointments.calendar'), { month: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
    };
    const nextMonth = () => {
        const d = new Date(year, m, 1);
        router.get(route('admin.appointments.calendar'), { month: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
    };

    const submit = (e) => {
        e.preventDefault();
        if (data.date && isUnavailable(data.date)) {
            return; // errors shown inline below the date field
        }
        post(route('admin.slots.store'), { onSuccess: () => { setShowSlotForm(false); reset(); } });
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

    const monthName = new Date(year, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <AdminLayout title="Appointment Calendar">
            <Head title="Calendar" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <button onClick={prevMonth} className="btn-secondary btn-sm px-2"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <h2 className="font-semibold text-gray-900 text-lg w-40 sm:w-48 text-center">{monthName}</h2>
                    <button onClick={nextMonth} className="btn-secondary btn-sm px-2"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
                <button onClick={() => openSlotForm()} className="btn-primary btn-sm">
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Slot
                </button>
            </div>

            <div className="card overflow-hidden overflow-x-auto">
                <div className="min-w-[640px]">
                    <div className="grid grid-cols-7 border-b border-gray-200">
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {Array(firstDay).fill(null).map((_, i) => (
                            <div key={`empty-${i}`} className="h-24 border-r border-b border-gray-100 bg-gray-50" />
                        ))}
                        {days.map(day => {
                            const dateStr = `${year}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                            const daySlots = slots[dateStr] || [];
                            const isToday = dateStr === currentDate;
                            const isExpanded = expandedDay === dateStr;
                            const visibleSlots = isExpanded ? daySlots : daySlots.slice(0, 2);
                            const unavailable = isUnavailable(dateStr);
                            const reason = unavailableReason(dateStr);

                            return (
                                <div
                                    key={day}
                                    className={`min-h-24 border-r border-b border-gray-100 p-1.5 ${isToday ? 'bg-clinic-50' : ''} ${unavailable ? 'bg-gray-100' : ''} ${isExpanded ? 'overflow-visible relative z-10' : 'overflow-hidden'}`}
                                    title={reason || ''}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className={`text-xs font-semibold ${isToday ? 'text-clinic-700' : unavailable ? 'text-gray-400' : 'text-gray-600'}`}>{day}</p>
                                        {holidayMap[dateStr] && (
                                            <span className="text-[10px] text-pink-500 truncate max-w-[60px]" title={holidayMap[dateStr]}>
                                                ●
                                            </span>
                                        )}
                                    </div>
                                    <div className={isExpanded ? 'absolute left-0 right-0 bg-white border border-gray-200 rounded shadow-lg p-1.5 z-20' : ''}>
                                        {visibleSlots.map(slot => (
                                            <div key={slot.id} className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-clinic-100 text-clinic-700 mb-0.5">
                                                <span className="flex-1 truncate">{slot.start_time} ({slot.pending_count + slot.approved_count}/{slot.max_appointments})</span>
                                                {isSuperAdmin && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(slot); }}
                                                        className="shrink-0 text-red-500 hover:text-red-700"
                                                        title="Delete slot"
                                                    >
                                                        <TrashIcon className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {!isExpanded && daySlots.length > 2 && (
                                            <button
                                                onClick={() => setExpandedDay(dateStr)}
                                                className="text-xs text-clinic-600 hover:underline"
                                            >
                                                +{daySlots.length - 2} more
                                            </button>
                                        )}
                                        {isExpanded && (
                                            <button
                                                onClick={() => setExpandedDay(null)}
                                                className="text-xs text-gray-400 hover:underline mt-1"
                                            >
                                                Show less
                                            </button>
                                        )}
                                        {!unavailable && daySlots.length === 0 && !isExpanded && (
                                            <button
                                                onClick={() => openSlotForm(dateStr)}
                                                className="text-xs text-gray-300 hover:text-clinic-600"
                                            >
                                                + slot
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" />
                Greyed-out days are weekends or Philippine holidays and are not available for slots.
                <span className="text-pink-500 ml-2">●</span> = holiday
            </p>

            {/* Add Slot Modal */}
            {showSlotForm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="font-semibold text-gray-900 mb-4">Create Appointment Slot</h3>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className="label">Date</label>
                                <input
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
                                { key:'start_time', label:'Start Time', type:'time' },
                                { key:'end_time', label:'End Time', type:'time' },
                                { key:'max_appointments', label:'Max Appointments', type:'number' },
                            ].map(({ key, label, type }) => (
                                <div key={key}>
                                    <label className="label">{label}</label>
                                    <input type={type} value={data[key]} onChange={e => setData(key, e.target.value)}
                                        className={`input ${errors[key] ? 'input-error' : ''}`} min={type==='number' ? 1 : undefined} />
                                    {errors[key] && <p className="error-msg">{errors[key]}</p>}
                                </div>
                            ))}
                            <div>
                                <label className="label">Notes (optional)</label>
                                <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} className="input" rows={2} />
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
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
                        <h3 className="font-semibold text-gray-900 mb-2">Delete Slot?</h3>
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">{confirmDelete.date}</span> — {confirmDelete.start_time} to {confirmDelete.end_time}
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