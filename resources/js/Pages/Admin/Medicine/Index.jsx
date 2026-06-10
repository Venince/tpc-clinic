import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function MedicineModal({ medicine, onClose }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: medicine?.name || '', description: medicine?.description || '',
        unit: medicine?.unit || 'tablets', quantity: medicine?.quantity || 0,
        reorder_level: medicine?.reorder_level || 10,
        expiration_date: medicine?.expiration_date || '', batch_number: medicine?.batch_number || '',
    });

    const submit = (e) => {
        e.preventDefault();
        const action = medicine
            ? put(route('admin.medicine.update', medicine.id), { onSuccess: () => { reset(); onClose(); } })
            : post(route('admin.medicine.store'), { onSuccess: () => { reset(); onClose(); } });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-4">{medicine ? 'Edit Medicine' : 'Add Medicine'}</h3>
                <form onSubmit={submit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="label">Name</label>
                            <input value={data.name} onChange={e => setData('name', e.target.value)} className={`input ${errors.name ? 'input-error' : ''}`} />
                            {errors.name && <p className="error-msg">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="label">Unit</label>
                            <select value={data.unit} onChange={e => setData('unit', e.target.value)} className="input">
                                {['tablets','capsules','ml','pcs','sachets','bottles','strips'].map(u => <option key={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Quantity</label>
                            <input type="number" min="0" value={data.quantity} onChange={e => setData('quantity', e.target.value)} className="input" />
                        </div>
                        <div>
                            <label className="label">Reorder Level</label>
                            <input type="number" min="0" value={data.reorder_level} onChange={e => setData('reorder_level', e.target.value)} className="input" />
                        </div>
                        <div>
                            <label className="label">Expiration Date</label>
                            <input type="date" value={data.expiration_date} onChange={e => setData('expiration_date', e.target.value)} className="input" />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Batch Number</label>
                            <input value={data.batch_number} onChange={e => setData('batch_number', e.target.value)} className="input" placeholder="Optional" />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Description</label>
                            <textarea value={data.description} onChange={e => setData('description', e.target.value)} className="input" rows={2} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn-primary">{processing ? 'Saving…' : 'Save'}</button>
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function MedicineIndex({ medicines, filters, stats }) {
    const [modalMed, setModalMed] = useState(undefined); // undefined = closed, null = new, object = edit
    const filtersObj = Array.isArray(filters) ? {} : (filters ?? {});
    const [search, setSearch] = useState(filtersObj.search || '');
    const [filter, setFilter] = useState(filtersObj.filter || '');

    const deleteMed = (m) => { if (confirm(`Delete ${m.name}?`)) router.delete(route('admin.medicine.destroy', m.id)); };

    const stockBadge = (m) => {
        if (m.is_out_of_stock) return <span className="badge badge-red">Out of Stock</span>;
        if (m.is_low_stock)    return <span className="badge badge-yellow">Low Stock</span>;
        return <span className="badge badge-green">In Stock</span>;
    };

    return (
        <AdminLayout title="Medicine Inventory">
            <Head title="Medicine" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-gray-500">Total Medicines</p></div>
                <div className="card p-4 text-center border-yellow-200 bg-yellow-50">
                    <p className="text-2xl font-bold text-yellow-700">{stats.low_stock}</p><p className="text-sm text-yellow-600">Low Stock</p>
                </div>
                <div className="card p-4 text-center border-red-200 bg-red-50">
                    <p className="text-2xl font-bold text-red-700">{stats.out}</p><p className="text-sm text-red-600">Out of Stock</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6 items-end">
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && router.get(route('admin.medicine.index'), { search, filter })}
                    className="input flex-1 min-w-48" placeholder="Search medicine…" />
                <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-36">
                    <option value="">All</option>
                    <option value="low">Low Stock</option>
                    <option value="out">Out of Stock</option>
                </select>
                <button onClick={() => router.get(route('admin.medicine.index'), { search, filter })} className="btn-primary btn-sm">Filter</button>
                <button onClick={() => setModalMed(null)} className="btn-primary btn-sm ml-auto">
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Medicine
                </button>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead><tr>
                            <th>Name</th>
                            <th>Unit</th>
                            <th>Quantity</th>
                            <th>Reorder</th>
                            <th>Expires</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {medicines.data.map(m => (
                                <tr key={m.id}>
                                    <td>
                                        <p className="font-medium text-gray-900">{m.name}</p>
                                        {m.batch_number && <p className="text-xs text-gray-400">Batch: {m.batch_number}</p>}
                                    </td>
                                    <td>{m.unit}</td>
                                    <td className={`font-semibold ${m.is_out_of_stock ? 'text-red-600' : m.is_low_stock ? 'text-yellow-600' : 'text-gray-900'}`}>{m.quantity}</td>
                                    <td className="text-gray-500">{m.reorder_level}</td>
                                    <td className={`text-sm ${m.is_expired ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{m.expiration_date || '—'}</td>
                                    <td>{stockBadge(m)}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button onClick={() => setModalMed(m)} className="text-gray-400 hover:text-clinic-600"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => deleteMed(m)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!medicines.data.length && (
                                <tr><td colSpan={7} className="text-center text-gray-400 py-8">No medicines found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalMed !== undefined && <MedicineModal medicine={modalMed} onClose={() => setModalMed(undefined)} />}
        </AdminLayout>
    );
}
