import { Head, useForm, router } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';
import { useState } from 'react';
import { BeakerIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function StudentMedicine({ medicines, myRequests }) {
    const [selected, setSelected] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        medicine_id: '', quantity_requested: 1, reason: '',
    });

    const openRequest = (med) => {
        setSelected(med);
        setData('medicine_id', med.id);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('student.medicine.store'), {
            onSuccess: () => { setSelected(null); reset(); },
        });
    };

    const statusBadge = (s) => {
        const map = { pending: 'badge-yellow', approved: 'badge-blue', rejected: 'badge-red', released: 'badge-green', cancelled: 'badge-gray' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    return (
        <StudentLayout title="Medicine">
            <Head title="Medicine" />

            <div className="page-header">
                <div>
                    <h2 className="page-title">Medicine Request</h2>
                    <p className="page-subtitle">Request medicine from the clinic</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available medicines */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900">Available Medicines</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {medicines.map(med => (
                            <div key={med.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{med.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{med.quantity} {med.unit} available</p>
                                    {med.description && <p className="text-xs text-gray-500 mt-0.5">{med.description}</p>}
                                </div>
                                <button onClick={() => openRequest(med)} className="btn-primary btn-sm">Request</button>
                            </div>
                        ))}
                        {!medicines.length && (
                            <div className="px-6 py-8 text-center text-gray-400">
                                <BeakerIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>No medicines available at the moment.</p>
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
                            <div key={req.id} className="px-6 py-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{req.medicine?.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Requested: {req.quantity_requested} {req.medicine?.unit}</p>
                                        {req.quantity_released && <p className="text-xs text-green-600">Released: {req.quantity_released} {req.medicine?.unit}</p>}
                                        <p className="text-xs text-gray-400 mt-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {statusBadge(req.status)}
                                        {req.status === 'pending' && (
                                            <button
                                                onClick={() => router.post(route('student.medicine.cancel', req.id), {}, { preserveScroll: true })}
                                                className="badge bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer border-0"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {req.rejection_reason && <p className="text-xs text-red-500 mt-2">Reason: {req.rejection_reason}</p>}
                            </div>
                        ))}
                        {!myRequests.length && (
                            <div className="px-6 py-8 text-center text-gray-400 text-sm">No requests yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Request Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Request: {selected.name}</h3>
                            <button onClick={() => { setSelected(null); reset(); }} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="label">Quantity ({selected.unit})</label>
                                <input type="number" min="1" max={selected.quantity}
                                    value={data.quantity_requested} onChange={e => setData('quantity_requested', parseInt(e.target.value))}
                                    className={`input ${errors.quantity_requested ? 'input-error' : ''}`} />
                                <p className="text-xs text-gray-400 mt-1">{selected.quantity} {selected.unit} available</p>
                                {errors.quantity_requested && <p className="error-msg">{errors.quantity_requested}</p>}
                            </div>
                            <div>
                                <label className="label">Reason / Purpose</label>
                                <textarea value={data.reason} onChange={e => setData('reason', e.target.value)}
                                    className={`input ${errors.reason ? 'input-error' : ''}`} rows={3}
                                    placeholder="Why do you need this medicine?" />
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
        </StudentLayout>
    );
}
