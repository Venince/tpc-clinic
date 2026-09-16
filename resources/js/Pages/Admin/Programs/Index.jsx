import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/UI/Modal';

export default function Programs({ programs }) {
    const [modal, setModal]       = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: '', name: '', description: '', is_active: true, logo: null, remove_logo: false,
    });

    const open = (p) => {
        setModal(p || 'new');
        setData(p
            ? { code: p.code, name: p.name, description: p.description || '', is_active: p.is_active, logo: null, remove_logo: false }
            : { code: '', name: '', description: '', is_active: true, logo: null, remove_logo: false });
        setLogoPreview(p?.logo_url || null);
    };
    const selectLogo = (e) => {
        const file = e.target.files?.[0] || null;
        setData(d => ({ ...d, logo: file, remove_logo: false }));
        setLogoPreview(file ? URL.createObjectURL(file) : null);
    };
    const clearLogo = () => {
        setData(d => ({ ...d, logo: null, remove_logo: true }));
        setLogoPreview(null);
    };
    const submit = (e) => {
        e.preventDefault();
        if (modal === 'new') post(route('admin.programs.store'), { forceFormData: true, onSuccess: () => { setModal(null); reset(); setLogoPreview(null); } });
        else put(route('admin.programs.update', modal.id), { forceFormData: true, onSuccess: () => { setModal(null); reset(); setLogoPreview(null); } });
    };

    return (
        <AdminLayout title="Programs">
            <Head title="Programs" />

            {/* Header */}
            <div className="page-header">
                <div>
                    <p className="page-subtitle">Manage college programs and view enrolled students</p>
                </div>
                <button onClick={() => open(null)} className="btn-primary btn-sm">
                    <PlusIcon className="w-4 h-4 mr-1" />Add Program
                </button>
            </div>

            <div className="card divide-y divide-gray-100">
                {programs.map(p => (
                    <div key={p.id} className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('admin.programs.show', p.id)}
                                className="flex items-center gap-3 flex-1 min-w-0 group"
                            >
                                {/* Logo (falls back to code badge) */}
                                {p.logo_url ? (
                                    <img
                                        src={p.logo_url}
                                        alt={`${p.code} logo`}
                                        className="w-10 h-10 min-w-[2.5rem] rounded-lg object-cover flex-shrink-0 border border-gray-200 bg-white"
                                    />
                                ) : (
                                    <div className="min-w-[2.5rem] h-10 bg-clinic-100 text-clinic-700 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 px-2 text-center leading-tight">
                                        {p.code}
                                    </div>
                                )}

                                {/* Name + description */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-clinic-600 transition-colors">
                                            {p.name}
                                        </p>
                                        <span className={`badge flex-shrink-0 ${p.is_active ? 'badge-green' : 'badge-gray'}`}>
                                            {p.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    {p.description && (
                                        <p className="hidden sm:block text-xs text-gray-400 mt-0.5 line-clamp-1">{p.description}</p>
                                    )}
                                    <p className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-clinic-600 transition-colors mt-1">
                                        <UsersIcon className="w-3.5 h-3.5" />
                                        <span>{p.student_profiles_count} students</span>
                                        <ChevronRightIcon className="w-3 h-3" />
                                    </p>
                                </div>
                            </Link>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => open(p)} className="text-gray-400 hover:text-clinic-600 p-1.5 rounded hover:bg-gray-100">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => { if (confirm('Delete?')) router.delete(route('admin.programs.destroy', p.id)); }}
                                    className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-gray-100">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {!programs.length && <div className="px-6 py-12 text-center text-gray-400">No programs yet.</div>}
            </div>

            {/* Modal */}
            {modal !== null && (
                <Modal onClose={() => setModal(null)} size="md">
                    <div className="p-6">
                        <h3 className="font-semibold mb-4">{modal === 'new' ? 'Add Program' : 'Edit Program'}</h3>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label htmlFor="program-code" className="label">Code</label>
                                <input id="program-code" name="code" value={data.code} onChange={e => setData('code', e.target.value)} className={`input ${errors.code ? 'input-error' : ''}`} placeholder="BSIT" />
                                {errors.code && <p className="error-msg">{errors.code}</p>}
                            </div>
                            <div>
                                <label htmlFor="program-name" className="label">Name</label>
                                <input id="program-name" name="name" autoComplete="off" value={data.name} onChange={e => setData('name', e.target.value)} className="input" placeholder="Bachelor of Science in..." />
                                {errors.name && <p className="error-msg">{errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="program-description" className="label">Description</label>
                                <textarea id="program-description" name="description" value={data.description} onChange={e => setData('description', e.target.value)} className="input" rows={2} />
                            </div>
                            <div>
                                <label htmlFor="program-logo" className="label">Logo</label>
                                <div className="flex items-center gap-3">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo preview" className="w-14 h-14 rounded-lg object-cover border border-gray-200 bg-white flex-shrink-0" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-lg bg-clinic-100 text-clinic-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                            {data.code || '—'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <input id="program-logo" name="logo" type="file" accept="image/*" onChange={selectLogo} className="input text-xs file:mr-2 file:text-xs" />
                                        {logoPreview && (
                                            <button type="button" onClick={clearLogo} className="text-xs text-red-500 hover:text-red-700 mt-1">
                                                Remove logo
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {errors.logo && <p className="error-msg">{errors.logo}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="program-active" name="is_active" type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded text-clinic-600" />
                                <label htmlFor="program-active" className="text-sm text-gray-700">Active</label>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button type="submit" disabled={processing} className="btn-primary flex-1 sm:flex-none">{processing ? 'Saving…' : 'Save'}</button>
                                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
