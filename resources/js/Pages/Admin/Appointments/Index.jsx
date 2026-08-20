import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { CalendarIcon, CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';

export default function AppointmentsIndex({ appointments, filters, stats, isSuperAdmin }) {
    const [status, setStatus]     = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo]     = useState(filters.date_to   || '');
    const [search, setSearch]     = useState(filters.search || '');
    const [declineId,   setDeclineId]   = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const { data, setData, post, processing, reset } = useForm({ reason: '' });

    const statusBadge = (s) => {
        const map = { pending:'badge-yellow', approved:'badge-green', declined:'badge-red', completed:'badge-purple', cancelled:'badge-gray' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    const approve  = (id) => router.post(route('admin.appointments.approve',  id));
    const complete = (id) => router.post(route('admin.appointments.complete', id));
    const decline  = (e) => {
        e.preventDefault();
        post(route('admin.appointments.decline', declineId), { onSuccess: () => { setDeclineId(null); reset(); } });
    };
    const deleteAppointment = () => {
        if (!confirmDelete) return;
        router.delete(route('admin.appointments.destroy', confirmDelete.id), {
            onFinish: () => setConfirmDelete(null),
        });
    };

    const formatDate = (isoDate) => {
        if (!isoDate) return '—';
        // Take the date portion only (YYYY-MM-DD) to avoid timezone-shifting the day
        // when the backend serializes the 'date' cast as a full ISO datetime.
        const [y, m, d] = isoDate.slice(0, 10).split('-');
        return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const isPast = (a) => {
        if (!a.slot?.date) return false;
        const [y, m, d] = a.slot.date.slice(0, 10).split('-').map(Number);
        const slotDay = new Date(y, m - 1, d);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return slotDay < today;
    };

    const canDelete = (a) => isSuperAdmin && ['declined', 'completed', 'cancelled'].includes(a.status) && !isPast(a);

    const applyFilters = () => router.get(route('admin.appointments.index'), { status, date_from: dateFrom, date_to: dateTo, search }, { preserveState: true });
    const clearFilters = () => { setStatus(''); setDateFrom(''); setDateTo(''); setSearch(''); router.get(route('admin.appointments.index')); };

    return (
        <AdminLayout title="Appointments">
            <Head title="Appointments" />

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {Object.entries(stats).map(([k, v]) => (
                    <div key={k} className="card p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{v}</p>
                        <p className="text-sm text-gray-500 capitalize">{k}</p>
                    </div>
                ))}
            </div>

            {/* Actions row */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6 sm:items-end">
                <div className="flex gap-3 flex-wrap">
                    <div className="flex-1 sm:flex-none">
                        <label htmlFor="filter-search" className="label text-xs">Patient</label>
                        <input
                            id="filter-search"
                            name="search"
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') applyFilters(); }}
                            placeholder="Name or email…"
                            className="input w-full sm:w-48"
                        />
                    </div>
                    <div className="flex-1 sm:flex-none">
                        <label htmlFor="filter-status" className="label text-xs">Status</label>
                        <select id="filter-status" name="status" value={status} onChange={e => setStatus(e.target.value)} className="input w-full sm:w-36">
                            <option value="">All</option>
                            {['pending','approved','declined','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 sm:flex-none">
                        <label htmlFor="filter-date-from" className="label text-xs">From</label>
                        <input id="filter-date-from" name="date_from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input w-full" />
                    </div>
                    <div className="flex-1 sm:flex-none">
                        <label htmlFor="filter-date-to" className="label text-xs">To</label>
                        <input id="filter-date-to" name="date_to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input w-full" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={applyFilters} className="btn-primary btn-sm flex-1 sm:flex-none">Filter</button>
                    <button onClick={clearFilters} className="btn-secondary btn-sm flex-1 sm:flex-none">Clear</button>
                </div>
                <Link href={route('admin.appointments.calendar')} className="btn-secondary btn-sm sm:ml-auto justify-center">
                    <CalendarIcon className="w-4 h-4 mr-1" /> Calendar View
                </Link>
            </div>

            <div className="card">
                <div className="table-wrapper overflow-x-auto">
                    <table className="table">
                        <thead><tr>
                            <th className="whitespace-nowrap">Patient</th>
                            <th className="whitespace-nowrap">Purpose</th>
                            <th className="whitespace-nowrap">Date & Time</th>
                            <th className="whitespace-nowrap">Status</th>
                            <th className="whitespace-nowrap">Actions</th>
                        </tr></thead>
                        <tbody>
                            {appointments.data.map(a => (
                                <tr key={a.id}>
                                    <td className="whitespace-nowrap">
                                        <div className="flex items-center gap-2.5">
                                            <UserAvatar user={a.user} size="sm" />
                                            <div>
                                                <p className="font-medium text-gray-900">{a.user?.name}</p>
                                                <p className="text-xs text-gray-400">{a.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap">{a.purpose}</td>
                                    <td className="whitespace-nowrap">
                                        <p className="text-sm">{formatDate(a.slot?.date)}</p>
                                        <p className="text-xs text-gray-400">{a.slot?.start_time} – {a.slot?.end_time}</p>
                                    </td>
                                    <td className="whitespace-nowrap">{statusBadge(a.status)}</td>
                                    <td className="whitespace-nowrap">
                                        <div className="flex gap-2 items-center">
                                            {a.status === 'pending' && <>
                                                <button onClick={() => approve(a.id)} className="btn-success btn-sm px-2 py-1">
                                                    <CheckIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => setDeclineId(a.id)} className="btn-danger btn-sm px-2 py-1">
                                                    <XMarkIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </>}
                                            {a.status === 'approved' && (
                                                <button onClick={() => complete(a.id)} className="btn-secondary btn-sm text-xs">Done</button>
                                            )}
                                            {canDelete(a) && (
                                                <button onClick={() => setConfirmDelete(a)} className="btn-danger btn-sm px-2 py-1" title="Delete appointment">
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!appointments.data.length && (
                                <tr><td colSpan={5} className="text-center text-gray-400 py-8">No appointments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {appointments.links.length > 3 && (
                    <div className="flex flex-wrap items-center justify-center gap-1 py-4 border-t border-gray-100">
                        {appointments.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                className={`px-3 py-1 text-sm rounded ${link.active ? 'bg-clinic-600 text-white' : link.url ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Decline modal */}
            {declineId && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/30 p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="font-semibold text-gray-900 mb-3">Decline Appointment</h3>
                        <form onSubmit={decline}>
                            <label htmlFor="decline-reason" className="sr-only">Reason for declining</label>
                            <textarea id="decline-reason" name="reason" value={data.reason} onChange={e => setData('reason', e.target.value)}
                                className="input" rows={3} placeholder="Reason for declining…" required />
                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                <button type="submit" disabled={processing} className="btn-danger flex-1 sm:flex-none">
                                    {processing ? 'Declining…' : 'Decline'}
                                </button>
                                <button type="button" onClick={() => { setDeclineId(null); reset(); }} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/30 p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
                        <h3 className="font-semibold text-gray-900 mb-2">Delete Appointment?</h3>
                        <p className="text-sm text-gray-600 mb-1 break-words">
                            <span className="font-medium">{confirmDelete.user?.name}</span> — {confirmDelete.slot?.date}
                        </p>
                        <p className="text-sm text-gray-500 mb-5">
                            Status: <span className="font-medium capitalize">{confirmDelete.status}</span>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={deleteAppointment} className="btn-danger flex-1 sm:flex-none">Delete</button>
                            <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 sm:flex-none">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
    