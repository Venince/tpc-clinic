import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/UI/Modal';

/**
 * Drop this into each walk-in log row/card in Admin/WalkinLog/Index.jsx:
 *
 *     import FollowUpAction from '@/Components/Admin/FollowUpAction';
 *     ...
 *     <FollowUpAction log={log} />
 *
 * It renders either a "Schedule Follow-Up" link, or (once one exists) the
 * current follow-up date with a click-to-manage modal for rescheduling or
 * cancelling. All state and requests are handled internally — the parent
 * page needs no extra state, just to render this once per log row.
 */
export default function FollowUpAction({ log }) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(log.follow_up_date || '');
    const [time, setTime] = useState(log.follow_up_time ? log.follow_up_time.slice(0, 5) : '');
    const [notes, setNotes] = useState(log.follow_up_notes || '');
    const [processing, setProcessing] = useState(false);

    const hasFollowUp = log.follow_up_status === 'scheduled';

    const openModal = () => {
        setDate(log.follow_up_date || '');
        setTime(log.follow_up_time ? log.follow_up_time.slice(0, 5) : '');
        setNotes(log.follow_up_notes || '');
        setOpen(true);
    };
    const closeModal = () => setOpen(false);

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        const routeName = hasFollowUp ? 'admin.walkin.followup.update' : 'admin.walkin.followup.store';
        const method = hasFollowUp ? 'put' : 'post';
        router[method](route(routeName, log.id), { follow_up_date: date, follow_up_time: time || null, follow_up_notes: notes }, {
            onSuccess: closeModal,
            onFinish: () => setProcessing(false),
        });
    };

    const cancelFollowUp = () => {
        if (!confirm('Cancel this follow-up visit?')) return;
        router.post(route('admin.walkin.followup.cancel', log.id), {}, { onSuccess: closeModal });
    };

    return (
        <>
            {hasFollowUp ? (
                <button onClick={openModal} className="inline-flex items-center gap-1 text-xs font-medium text-clinic-600 hover:text-clinic-700">
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    Follow-up: {log.follow_up_date}{log.follow_up_time ? ` ${new Date(`1970-01-01T${log.follow_up_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                </button>
            ) : (
                <button onClick={openModal} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    Schedule Follow-Up
                </button>
            )}

            {open && (
                <Modal onClose={closeModal} size="sm">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">
                                {hasFollowUp ? 'Reschedule Follow-Up' : 'Schedule Follow-Up'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor={`followup-date-${log.id}`} className="label">Return Date</label>
                                    <input
                                        id={`followup-date-${log.id}`} type="date" value={date}
                                        onChange={e => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="input" required
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`followup-time-${log.id}`} className="label">
                                        Time <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        id={`followup-time-${log.id}`} type="time" value={time}
                                        onChange={e => setTime(e.target.value)}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor={`followup-notes-${log.id}`} className="label">
                                    Reason <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    id={`followup-notes-${log.id}`} value={notes}
                                    onChange={e => setNotes(e.target.value)} className="input" rows={2}
                                    placeholder="e.g. Re-check blood pressure…"
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="submit" disabled={processing || !date} className="btn-primary flex-1">
                                    {processing ? 'Saving…' : hasFollowUp ? 'Save' : 'Schedule'}
                                </button>
                                {hasFollowUp && (
                                    <button type="button" onClick={cancelFollowUp} className="btn-secondary">
                                        Cancel Follow-Up
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </>
    );
}
