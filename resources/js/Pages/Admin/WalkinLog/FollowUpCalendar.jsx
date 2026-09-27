import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/UI/Modal';

const WEEKDAY_FULL  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const STATUS_DOT   = { scheduled: 'bg-yellow-400', completed: 'bg-green-500', cancelled: 'bg-gray-300' };
const STATUS_BADGE = { scheduled: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-gray' };

export default function FollowUpCalendar({ followupsByDate, month, currentDate, holidays }) {
    const [dayDetail, setDayDetail] = useState(null);
    const [reschedule, setReschedule] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleNotes, setRescheduleNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const [year, m] = month.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();
    const firstDay = new Date(year, m - 1, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const holidayMap = Object.fromEntries((holidays || []).map(h => [h.date, h.name]));
    const isWeekend = (dateStr) => [0, 6].includes(new Date(dateStr + 'T00:00:00').getDay());
    const isUnavailable = (dateStr) => isWeekend(dateStr) || !!holidayMap[dateStr];

    const goToMonth = (d) => router.get(route('admin.walkin.followups.index'), {
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
    const prevMonth = () => goToMonth(new Date(year, m - 2, 1));
    const nextMonth = () => goToMonth(new Date(year, m, 1));

    const openReschedule = (log) => {
        setReschedule(log);
        setRescheduleDate(log.follow_up_date);
        setRescheduleTime(log.follow_up_time ? log.follow_up_time.slice(0, 5) : '');
        setRescheduleNotes(log.follow_up_notes || '');
    };
    const closeReschedule = () => { setReschedule(null); setRescheduleDate(''); setRescheduleTime(''); setRescheduleNotes(''); };

    const submitReschedule = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.put(route('admin.walkin.followup.update', reschedule.id), {
            follow_up_date: rescheduleDate,
            follow_up_time: rescheduleTime || null,
            follow_up_notes: rescheduleNotes,
        }, {
            onSuccess: () => { closeReschedule(); setDayDetail(null); },
            onFinish: () => setProcessing(false),
        });
    };

    const cancelFollowUp = (log) => {
        if (!confirm('Cancel this follow-up visit?')) return;
        router.post(route('admin.walkin.followup.cancel', log.id), {}, { onSuccess: () => setDayDetail(null) });
    };

    const completeFollowUp = (log) => {
        router.post(route('admin.walkin.followup.complete', log.id), {}, { onSuccess: () => setDayDetail(null) });
    };

    const monthName = new Date(year, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <AdminLayout title="Follow-Up Calendar">
            <Head title="Follow-Up Calendar" />

            <div className="flex flex-col gap-3 mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-3">
                    <button onClick={prevMonth} className="btn-secondary btn-sm px-2"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <h2 className="font-semibold text-gray-900 text-base sm:text-lg w-36 sm:w-48 text-center">{monthName}</h2>
                    <button onClick={nextMonth} className="btn-secondary btn-sm px-2"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-row gap-2">
                    <Link
                        href={route('admin.walkin.index')}
                        className="btn-secondary justify-center flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                    >
                        <CalendarDaysIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        Walk-In Log
                    </Link>
                </div>
            </div>

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
                        const dayFollowups = followupsByDate[dateStr] || [];
                        const isToday = dateStr === currentDate;
                        const unavailable = isUnavailable(dateStr);
                        const statusesPresent = [...new Set(dayFollowups.map(f => f.follow_up_status))].slice(0, 3);

                        return (
                            <button
                                type="button"
                                key={day}
                                onClick={() => dayFollowups.length && setDayDetail(dateStr)}
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
                                {dayFollowups.length > 0 && (
                                    <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1">
                                        {statusesPresent.map(status => (
                                            <span key={status} className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-gray-300'}`} />
                                        ))}
                                        <span className="text-[9px] sm:text-[11px] text-gray-500">{dayFollowups.length}</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] sm:text-xs text-gray-400">
                {Object.entries(STATUS_DOT).map(([status, dot]) => (
                    <span key={status} className="flex items-center gap-1.5 capitalize">
                        <span className={`w-2 h-2 rounded-full inline-block ${dot}`} /> {status}
                    </span>
                ))}
            </div>

            {dayDetail && (() => {
                const dayFollowups = followupsByDate[dayDetail] || [];
                const prettyDate = new Date(dayDetail + 'T00:00:00')
                    .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

                return (
                    <Modal onClose={() => setDayDetail(null)} size="md">
                        <div className="p-6 max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">{prettyDate}</h3>
                                <button onClick={() => setDayDetail(null)} className="text-gray-400 hover:text-gray-600">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {dayFollowups.map(log => (
                                    <div key={log.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {log.user?.name}
                                                    {log.follow_up_time && (
                                                        <span className="ml-1.5 font-normal text-gray-500">
                                                            · {new Date(`1970-01-01T${log.follow_up_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{log.chief_complaint}</p>
                                                {log.follow_up_notes && (
                                                    <p className="text-xs text-gray-600 mt-1">{log.follow_up_notes}</p>
                                                )}
                                            </div>
                                            <span className={`badge ${STATUS_BADGE[log.follow_up_status] || 'badge-gray'} whitespace-nowrap shrink-0`}>
                                                {log.follow_up_status}
                                            </span>
                                        </div>
                                        {log.follow_up_status === 'scheduled' && (
                                            <div className="flex gap-3 mt-2.5 pt-2.5 border-t border-gray-200">
                                                <button onClick={() => openReschedule(log)} className="text-xs font-medium text-clinic-600 hover:text-clinic-700">
                                                    Reschedule
                                                </button>
                                                <button onClick={() => completeFollowUp(log)} className="text-xs font-medium text-green-600 hover:text-green-700">
                                                    Mark Completed
                                                </button>
                                                <button onClick={() => cancelFollowUp(log)} className="text-xs font-medium text-red-500 hover:text-red-700">
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Modal>
                );
            })()}

            {reschedule && (
                <Modal onClose={closeReschedule} size="sm">
                    <div className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Reschedule Follow-Up</h3>
                        <form onSubmit={submitReschedule} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="reschedule-date" className="label">New Date</label>
                                    <input
                                        id="reschedule-date" type="date" value={rescheduleDate}
                                        onChange={e => setRescheduleDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="reschedule-time" className="label">
                                        Time <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        id="reschedule-time" type="time" value={rescheduleTime}
                                        onChange={e => setRescheduleTime(e.target.value)}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="reschedule-notes" className="label">
                                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    id="reschedule-notes" value={rescheduleNotes}
                                    onChange={e => setRescheduleNotes(e.target.value)} className="input" rows={2}
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="submit" disabled={processing || !rescheduleDate} className="btn-primary flex-1">
                                    {processing ? 'Saving…' : 'Save'}
                                </button>
                                <button type="button" onClick={closeReschedule} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
