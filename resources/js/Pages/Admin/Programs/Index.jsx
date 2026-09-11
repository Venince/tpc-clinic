import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';
import PhotoLightbox from '@/Components/Common/PhotoLightbox';
import Modal from '@/Components/UI/Modal';

export default function Programs({ programs }) {
    const [modal, setModal]       = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [searches, setSearches] = useState({});
    const [viewingPhoto, setViewingPhoto] = useState(null);
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

    const filterStudents = (students, query) => {
        const sorted = [...students].sort((a, b) =>
            (a.user?.name || '').localeCompare(b.user?.name || '')
        );
        if (!query) return sorted;
        const q = query.toLowerCase();
        return sorted.filter(sp =>
            sp.user?.name?.toLowerCase().includes(q) ||
            sp.user?.email?.toLowerCase().includes(q) ||
            sp.student_id?.toLowerCase().includes(q) ||
            sp.block?.toLowerCase().includes(q)
        );
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
                {programs.map(p => {
                    const query    = searches[p.id] || '';
                    const filtered = filterStudents(p.student_profiles || [], query);

                    return (
                        <div key={p.id}>
                            {/* Program Row */}
                            <div className="px-4 sm:px-6 py-3 sm:py-4">
                                <div className="flex items-center gap-3">
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
                                            <p className="font-semibold text-gray-900 text-sm leading-tight">{p.name}</p>
                                            <span className={`badge flex-shrink-0 ${p.is_active ? 'badge-green' : 'badge-gray'}`}>
                                                {p.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {p.description && (
                                            <p className="hidden sm:block text-xs text-gray-400 mt-0.5 line-clamp-1">{p.description}</p>
                                        )}
                                    </div>

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

                                {/* Students toggle */}
                                <button
                                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                                    className="mt-2 ml-[3.25rem] flex items-center gap-1.5 text-xs text-gray-500 hover:text-clinic-600 transition-colors px-2 py-1 rounded hover:bg-clinic-50"
                                >
                                    <UsersIcon className="w-3.5 h-3.5" />
                                    <span>{p.student_profiles_count} students</span>
                                    {expanded === p.id
                                        ? <ChevronUpIcon className="w-3 h-3" />
                                        : <ChevronDownIcon className="w-3 h-3" />}
                                </button>
                            </div>

                            {/* Expanded Students */}
                            {expanded === p.id && (
                                <div className="bg-gray-50 px-4 sm:px-6 pb-4">
                                    {p.student_profiles?.length ? (
                                        <>
                                            <div className="relative mb-3">
                                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <label className="sr-only" htmlFor={`program-search-${p.id}`}>Search students</label>
                                                <input
                                                    id={`program-search-${p.id}`}
                                                    name={`program-search-${p.id}`}
                                                    autoComplete="off"
                                                    value={query}
                                                    onChange={e => setSearches(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                    className="input pl-9 pr-20 sm:pr-24 w-full sm:max-w-sm text-sm"
                                                    placeholder="Search by name, email, ID, or block…"
                                                />
                                                {query && (
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 whitespace-nowrap">
                                                        {filtered.length} of {p.student_profiles.length}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                    <thead className="bg-white">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Name</th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Email</th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Student ID</th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Year</th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Block</th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Status</th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Pregnant</th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Last Login</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-100">
                                                        {filtered.length ? filtered.map(sp => (
                                                            <tr key={sp.id} className="hover:bg-clinic-50 cursor-pointer transition-colors"
                                                                onClick={() => router.visit(route('admin.programs.students.show', sp.id))}>
                                                                <td className="px-4 py-2 whitespace-nowrap">
                                                                    <div className="flex items-center gap-2">
                                                                        <UserAvatar user={sp.user} size="xs" onClick={() => setViewingPhoto(sp.user)} />
                                                                        <span className="font-medium text-gray-900">{sp.user?.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{sp.user?.email}</td>
                                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{sp.student_id || '—'}</td>
                                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{sp.year_level ? `Year ${sp.year_level}` : '—'}</td>
                                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{sp.block || '—'}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap">
                                                                    <span className={`badge ${sp.user?.is_active ? 'badge-green' : 'badge-red'}`}>
                                                                        {sp.user?.is_active ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 whitespace-nowrap">
                                                                    {sp.is_pregnant
                                                                        ? <span className="badge badge-red text-xs">Yes</span>
                                                                        : <span className="text-gray-400 text-xs">No</span>}
                                                                </td>
                                                                <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                                                                    {sp.user?.last_login_at ? new Date(sp.user.last_login_at).toLocaleDateString() : 'Never'}
                                                                </td>
                                                            </tr>
                                                        )) : (
                                                            <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400 text-sm">No students match "{query}".</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-400 py-4 text-center">No students enrolled in this program yet.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
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

            <PhotoLightbox
                photoUrl={viewingPhoto?.profile_photo_url}
                name={viewingPhoto?.name}
                onClose={() => setViewingPhoto(null)}
            />
        </AdminLayout>
    );
}