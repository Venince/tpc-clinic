import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';

export default function MedicineRequests({ requests, filters, stats }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.role === 'super_admin';

    const [status, setStatus] = useState(filters.status || '');
    const [rejectId,   setRejectId]   = useState(null);
    const [releaseId,  setReleaseId]  = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const rejectForm  = useForm({ reason: '' });
    const releaseForm = useForm({ quantity_released: 1 });

    const approve = (id) => router.post(route('admin.medicine.requests.approve', id));
    const reject  = (e) => { e.preventDefault(); rejectForm.post(route('admin.medicine.requests.reject', rejectId), { onSuccess: () => setRejectId(null) }); };
    const release = (e) => { e.preventDefault(); releaseForm.post(route('admin.medicine.requests.release', releaseId), { onSuccess: () => setReleaseId(null) }); };

    const handleDelete = (id) => {
        if (!confirm('Are you sure you want to delete this medicine request? This cannot be undone.')) return;
        setDeletingId(id);
        router.delete(route('admin.medicine.requests.destroy', id), {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const statusBadge = (s) => {
        const map = { pending:'badge-yellow', approved:'badge-blue', rejected:'badge-red', released:'badge-green', cancelled:'badge-red' };
        return <span className={`badge ${map[s] ?? 'badge-gray'}`}>{s}</span>;
    };

    const RequestActions = ({ r }) => (
        <div className="flex flex-wrap gap-2">
            {r.status === 'pending' && <>
                <button onClick={() => approve(r.id)} className="btn-success btn-sm text-xs">Approve</button>
                <button onClick={() => setRejectId(r.id)} className="btn-danger btn-sm text-xs">Reject</button>
            </>}
            {r.status === 'approved' && (
                <button onClick={() => { setReleaseId(r.id); releaseForm.setData('quantity_released', r.quantity_requested); }} className="btn-primary btn-sm text-xs">Release</button>
            )}
            {isSuperAdmin && (
                <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id} className="btn-danger btn-sm text-xs flex items-center gap-1">
                    <TrashIcon className="w-3.5 h-3.5" />
                    {deletingId === r.id ? 'Deleting…' : 'Delete'}
                </button>
            )}
        </div>
    );

    return (
        <AdminLayout title="Medicine Requests">
            <Head title="Medicine Requests" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="card p-3 md:p-4 text-center">
                    <p className="text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-xs md:text-sm text-gray-500">Pending</p>
                </div>
                <div className="card p-3 md:p-4 text-center">
                    <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.approved}</p>
                    <p className="text-xs md:text-sm text-gray-500">Approved</p>
                </div>
                <div className="card p-3 md:p-4 text-center">
                    <p className="text-xl md:text-2xl font-bold text-green-600">{stats.released}</p>
                    <p className="text-xs md:text-sm text-gray-500">Released</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-3 mb-6">
                <select value={status} onChange={e => setStatus(e.target.value)} className="input flex-1 sm:flex-none sm:w-40">
                    <option value="">All Statuses</option>
                    {['pending','approved','rejected','released'].map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => router.get(route('admin.medicine.requests'), { status })} className="btn-primary btn-sm">Filter</button>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {requests.data.map(r => (
                    <div key={r.id} className="card p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <UserAvatar user={r.user} size="sm" className="flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{r.user?.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{r.user?.email}</p>
                                </div>
                            </div>
                            {statusBadge(r.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                            <div>
                                <span className="text-gray-400">Medicine: </span>
                                <span className="text-gray-700">{r.medicine?.name} <span className="text-gray-400">({r.medicine?.unit})</span></span>
                            </div>
                            <div>
                                <span className="text-gray-400">Qty: </span>
                                <span className="font-semibold text-gray-900">{r.quantity_requested}</span>
                            </div>
                            {r.reason && (
                                <div className="col-span-2">
                                    <span className="text-gray-400">Reason: </span>
                                    <span className="text-gray-700">{r.reason}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <RequestActions r={r} />
                        </div>
                    </div>
                ))}
                {!requests.data.length && (
                    <div className="card p-8 text-center text-gray-400">No requests found.</div>
                )}
            </div>

            {/* Desktop Table */}
            <div className="card hidden md:block">
                <div className="table-wrapper">
                    <table className="table">
                        <thead><tr>
                            <th>Patient</th><th>Medicine</th><th>Qty</th><th>Reason</th><th>Status</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {requests.data.map(r => (
                                <tr key={r.id}>
                                    <td>
                                        <div className="flex items-center gap-2.5">
                                            <UserAvatar user={r.user} size="sm" />
                                            <div>
                                                <p className="font-medium text-gray-900">{r.user?.name}</p>
                                                <p className="text-xs text-gray-400">{r.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{r.medicine?.name} <span className="text-xs text-gray-400">({r.medicine?.unit})</span></td>
                                    <td className="font-semibold">{r.quantity_requested}</td>
                                    <td className="max-w-xs truncate text-gray-500">{r.reason}</td>
                                    <td>{statusBadge(r.status)}</td>
                                    <td><RequestActions r={r} /></td>
                                </tr>
                            ))}
                            {!requests.data.length && <tr><td colSpan={6} className="text-center text-gray-400 py-8">No requests found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reject Modal */}
            {rejectId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-semibold mb-3">Reject Request</h3>
                        <form onSubmit={reject}>
                            <textarea value={rejectForm.data.reason} onChange={e => rejectForm.setData('reason', e.target.value)} className="input" rows={3} placeholder="Reason for rejection…" required />
                            <div className="flex gap-3 mt-4">
                                <button type="submit" disabled={rejectForm.processing} className="btn-danger flex-1">Reject</button>
                                <button type="button" onClick={() => setRejectId(null)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Release Modal */}
            {releaseId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-semibold mb-3">Release Medicine</h3>
                        <form onSubmit={release}>
                            <label className="label">Quantity to Release</label>
                            <input type="number" min="1" value={releaseForm.data.quantity_released}
                                onChange={e => releaseForm.setData('quantity_released', e.target.value)} className="input" />
                            <div className="flex gap-3 mt-4">
                                <button type="submit" disabled={releaseForm.processing} className="btn-primary flex-1">Release</button>
                                <button type="button" onClick={() => setReleaseId(null)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
