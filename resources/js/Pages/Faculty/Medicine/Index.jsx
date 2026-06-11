import { Head, useForm, router } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import { useState } from 'react';
import { BeakerIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function FacultyMedicine({ medicines, myRequests }) {
    const [selected, setSelected] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({ medicine_id: '', quantity_requested: 1, reason: '' });

    const openRequest = (med) => { setSelected(med); setData('medicine_id', med.id); };
    const submit = (e) => { e.preventDefault(); post(route('faculty.medicine.store'), { onSuccess: () => { setSelected(null); reset(); } }); };

    const cancel  = (id) => { if (confirm('Cancel this request?')) router.post(route('faculty.medicine.cancel', id), {}, { preserveScroll: true }); };
    const destroy = (id) => { if (confirm('Delete this request? This cannot be undone.')) router.delete(route('faculty.medicine.destroy', id), {}, { preserveScroll: true }); };

    const statusBadge = (s) => {
        const map = { pending: 'badge-yellow', approved: 'badge-blue', rejected: 'badge-red', released: 'badge-green', cancelled: 'badge-gray' };
        return <span className={`badge ${map[s] || 'badge-gray'} whitespace-nowrap`}>{s}</span>;
    };

    const canDelete = (s) => ['cancelled', 'rejected', 'released'].includes(s);

    return (
        <FacultyLayout title="Medicine">
            <Head title="Medicine" />

            <div className="page-header">
                <div>
                    <h2 className="page-title">Medicine Request</h2>
                    <p className="page-subtitle">Request medicine from the clinic</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Available medicines */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900">Available Medicines</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {medicines.map(med => (
                            <div key={med.id} className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{med.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{med.quantity} {med.unit} available</p>
                                </div>
                                <button onClick={() => openRequest(med)} className="btn-primary btn-sm flex-shrink-0">Request</button>
                            </div>
                        ))}
                        {!medicines.length && (
                            <div className="px-6 py-8 text-center text-gray-400">
                                <BeakerIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No medicines available.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* My requests */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900">My Requests</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {myRequests.map(req => (
                            <div key={req.id} className="px-4 sm:px-6 py-4 space-y-2">
                                {/* Top row: name + status badge */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{req.medicine?.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Qty: {req.quantity_requested} · {req.reason}</p>
                                    </div>
                                    {statusBadge(req.status)}
                                </div>

                                {/* Action row — full width on mobile, easy to tap */}
                                {(req.status === 'pending' || canDelete(req.status)) && (
                                    <div className="flex items-center gap-2 pt-1">
                                        {req.status === 'pending' && (
                                            <button
                                                onClick={() => cancel(req.id)}
                                                className="flex-1 sm:flex-none text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5 transition-colors text-center"
                                            >
                                                Cancel request
                                            </button>
                                        )}
                                        {canDelete(req.status) && (
                                            <button
                                                onClick={() => destroy(req.id)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 bg-gray-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {!myRequests.length && (
                            <div className="px-6 py-8 text-center text-gray-400 text-sm">No requests yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Request Modal — bottom sheet on mobile */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 truncate pr-4">Request: {selected.name}</h3>
                            <button onClick={() => { setSelected(null); reset(); }} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="label">Quantity ({selected.unit})</label>
                                <input type="number" min="1" max={selected.quantity}
                                    value={data.quantity_requested} onChange={e => setData('quantity_requested', parseInt(e.target.value))}
                                    className="input" />
                                <p className="text-xs text-gray-400 mt-1">{selected.quantity} {selected.unit} available</p>
                            </div>
                            <div>
                                <label className="label">Reason</label>
                                <textarea value={data.reason} onChange={e => setData('reason', e.target.value)}
                                    className="input" rows={3} placeholder="Why do you need this medicine?" />
                                {errors.reason && <p className="error-msg">{errors.reason}</p>}
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" disabled={processing} className="btn-primary flex-1">
                                    {processing ? 'Submitting…' : 'Submit Request'}
                                </button>
                                <button type="button" onClick={() => { setSelected(null); reset(); }} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </FacultyLayout>
    );
}
