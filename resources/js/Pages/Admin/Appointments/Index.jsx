import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { CalendarIcon, CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function AppointmentsIndex({ appointments, filters, stats, isSuperAdmin }) {
    const [status, setStatus] = useState(filters.status || '');
    const [date,   setDate]   = useState(filters.date   || '');
    const [declineId,   setDeclineId]   = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // holds appointment object
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

    // Super admin can delete declined, completed, or cancelled appointments
    const canDelete = (a) => isSuperAdmin && ['declined', 'completed', 'cancelled'].includes(a.status);

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
            <div className="flex flex-wrap gap-3 mb-6 items-end">
                <div>
                    <label className="label text-xs">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="input w-36">
                        <option value="">All</option>
                        {['pending','approved','declined','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label text-xs">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
                </div>
                <button onClick={() => router.get(route('admin.appointments.index'), { status, date }, { preserveState: true })} className="btn-primary btn-sm">Filter</button>
                <button onClick={() => { setStatus(''); setDate(''); router.get(route('admin.appointments.index')); }} className="btn-secondary btn-sm">Clear</button>
                <Link href={route('admin.appointments.calendar')} className="btn-secondary btn-sm ml-auto">
                    <CalendarIcon className="w-4 h-4 mr-1" /> Calendar View
                </Link>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead><tr>
                            <th>Patient</th><th>Purpose</th><th>Date & Time</th><th>Status</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {appointments.data.map(a => (
                                <tr key={a.id}>
                                    <td>
                                        <p className="font-medium text-gray-900">{a.user?.name}</p>
                                        <p className="text-xs text-gray-400">{a.user?.email}</p>
                                    </td>
                                    <td>{a.purpose}</td>
                                    <td>
                                        <p className="text-sm">{a.slot?.date}</p>
                                        <p className="text-xs text-gray-400">{a.slot?.start_time} – {a.slot?.end_time}</p>
                                    </td>
                                    <td>{statusBadge(a.status)}</td>
                                    <td>
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
            </div>

            {/* Decline modal */}
            {declineId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h3 className="font-semibold text-gray-900 mb-3">Decline Appointment</h3>
                        <form onSubmit={decline}>
                            <textarea value={data.reason} onChange={e => setData('reason', e.target.value)}
                                className="input" rows={3} placeholder="Reason for declining…" required />
                            <div className="flex gap-3 mt-4">
                                <button type="submit" disabled={processing} className="btn-danger">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="font-semibold text-gray-900 mb-2">Delete Appointment?</h3>
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">{confirmDelete.user?.name}</span> — {confirmDelete.slot?.date}
                        </p>
                        <p className="text-sm text-gray-500 mb-5">
                            Status: <span className="font-medium capitalize">{confirmDelete.status}</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={deleteAppointment} className="btn-danger">Delete</button>
                            <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}