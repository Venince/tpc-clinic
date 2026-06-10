import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import {
    PlusIcon, TrashIcon, CheckIcon, XMarkIcon,
    EyeIcon, MagnifyingGlassIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function RequirementsIndex({ types, requirements, programs, filters }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth?.user?.role?.name === 'super_admin';

    const [showAdd, setShowAdd]           = useState(false);
    const [reviewing, setReviewing]       = useState(null);
    const [previewing, setPreviewing]     = useState(null);
    const [showClear, setShowClear]       = useState(false);
    const [search, setSearch]             = useState(filters?.search || '');
    const [status, setStatus]             = useState(filters?.status || '');
    const [programId, setProgramId]       = useState(filters?.program_id || '');

    const addForm    = useForm({ name: '', description: '' });
    const reviewForm = useForm({ status: 'approved', reason: '' });
    const clearForm  = useForm({ user_type: '' });

    const applyFilters = () => router.get(route('admin.requirements.index'), {
        search, status, program_id: programId,
    }, { preserveState: true });

    const clearFilters = () => {
        setSearch(''); setStatus(''); setProgramId('');
        router.get(route('admin.requirements.index'));
    };

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post(route('admin.requirements.types.store'), {
            onSuccess: () => { setShowAdd(false); addForm.reset(); },
        });
    };

    const submitReview = (e) => {
        e.preventDefault();
        reviewForm.post(route('admin.requirements.review', reviewing.id), {
            onSuccess: () => { setReviewing(null); reviewForm.reset(); },
        });
    };

    const submitClear = (e) => {
        e.preventDefault();
        clearForm.post(route('admin.requirements.clear-submissions'), {
            onSuccess: () => { setShowClear(false); clearForm.reset(); },
        });
    };

    const userTypeLabel = (val) => ({
        student:       'Students',
        faculty_staff: 'Faculty / Staff',
        both:          'Students & Faculty / Staff',
    }[val] ?? '');

    const statusBadge = (s) => {
        const map = {
            approved:     'badge-green',
            pending:      'badge-yellow',
            rejected:     'badge-red',
            not_uploaded: 'badge-gray',
        };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s.replace('_', ' ')}</span>;
    };

    const isImage = (f) => /\.(jpe?g|png|gif|webp)$/i.test(f || '');
    const isPdf   = (f) => /\.pdf$/i.test(f || '');

    return (
        <AdminLayout title="Medical Requirements">
            <Head title="Requirements" />
            <div className="page-header">
                <div><h2 className="page-title">Medical Requirements</h2></div>
                <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                        <button
                            onClick={() => setShowClear(true)}
                            className="btn-danger btn-sm flex items-center gap-1"
                            title="Clear all submissions for a user group"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Clear Submissions
                        </button>
                    )}
                    <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1">
                        <PlusIcon className="w-4 h-4" />Add Type
                    </button>
                </div>
            </div>

            {/* Requirement Types */}
            <div className="card mb-6">
                <div className="card-header"><h3 className="font-semibold text-gray-900">Requirement Types</h3></div>
                <div className="divide-y divide-gray-100">
                    {types.map(t => (
                        <div key={t.id} className="px-6 py-3 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">{t.name}</p>
                                {t.description && <p className="text-xs text-gray-400">{t.description}</p>}
                                <p className="text-xs text-gray-400 mt-0.5">{t.user_requirements_count} submissions</p>
                            </div>
                            <button
                                onClick={() => { if (confirm('Delete this requirement type?')) router.delete(route('admin.requirements.types.destroy', t.id)); }}
                                className="text-gray-400 hover:text-red-500"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {!types.length && (
                        <div className="px-6 py-6 text-center text-gray-400 text-sm">No requirement types.</div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="label">Search</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                    className="input pl-9"
                                    placeholder="Search by name or email…"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="input">
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Program</label>
                            <select value={programId} onChange={e => setProgramId(e.target.value)} className="input">
                                <option value="">All Programs</option>
                                {programs.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={applyFilters} className="btn-primary btn-sm">Filter</button>
                            {(search || status || programId) && (
                                <button onClick={clearFilters} className="btn-secondary btn-sm">Clear</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="font-semibold text-gray-900">Submissions</h3>
                    <span className="text-xs text-gray-400">{requirements.total} total</span>
                </div>
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Program</th>
                                <th>Requirement</th>
                                <th>File</th>
                                <th>Uploaded</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requirements.data.map(r => (
                                <tr key={r.id}>
                                    <td>
                                        <p className="font-medium text-sm">{r.user?.name}</p>
                                        <p className="text-xs text-gray-400">{r.user?.email}</p>
                                    </td>
                                    <td className="text-xs text-gray-500">
                                        {r.user?.student_profile?.program?.code || '—'}
                                    </td>
                                    <td className="text-sm">{r.requirement_type?.name}</td>
                                    <td>
                                        {r.file_path ? (
                                            <button
                                                onClick={() => setPreviewing(r)}
                                                className="flex items-center gap-1 text-clinic-600 hover:text-clinic-800 text-xs font-medium"
                                            >
                                                <EyeIcon className="w-3.5 h-3.5" />
                                                {r.original_filename || 'View file'}
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400">No file</span>
                                        )}
                                    </td>
                                    <td className="text-xs text-gray-400">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </td>
                                    <td>{statusBadge(r.approval_status)}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            {r.approval_status === 'pending' && <>
                                                <button
                                                    onClick={() => { setReviewing(r); reviewForm.setData('status', 'approved'); }}
                                                    className="btn-success btn-sm px-2 py-1" title="Approve"
                                                >
                                                    <CheckIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => { setReviewing(r); reviewForm.setData('status', 'rejected'); }}
                                                    className="btn-danger btn-sm px-2 py-1" title="Reject"
                                                >
                                                    <XMarkIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </>}
                                            {r.approval_status !== 'pending' && (
                                                <span className="text-xs text-gray-400 italic">
                                                    {r.reviewer?.name ? `by ${r.reviewer.name}` : '—'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!requirements.data?.length && (
                                <tr>
                                    <td colSpan={7} className="text-center text-gray-400 py-8">
                                        No submissions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {requirements.links?.length > 3 && (
                    <div className="px-6 py-4 flex justify-center gap-1 border-t border-gray-100">
                        {requirements.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, { search, status, program_id: programId })}
                                className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-clinic-600 text-white' : 'hover:bg-gray-100 text-gray-600'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Clear Submissions Modal (super_admin only) ───────────────────── */}
            {showClear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-start gap-3 px-6 pt-6 pb-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-base">Clear Submissions</h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    This permanently deletes all uploaded files and submission records for the selected group.
                                    Users will need to re-submit their requirements.
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <form onSubmit={submitClear}>
                            <div className="px-6 pb-5 space-y-3">
                                <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                    Select user group to clear
                                </p>

                                {[
                                    { value: 'student',       label: 'Students only',          sub: 'Clears all student requirement submissions.' },
                                    { value: 'faculty_staff', label: 'Faculty / Staff only',   sub: 'Clears all faculty and staff submissions.' },
                                    { value: 'both',          label: 'Students & Faculty / Staff', sub: 'Clears every submission across all users.' },
                                ].map(opt => (
                                    <label
                                        key={opt.value}
                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            clearForm.data.user_type === opt.value
                                                ? 'border-red-400 bg-red-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="user_type"
                                            value={opt.value}
                                            checked={clearForm.data.user_type === opt.value}
                                            onChange={() => clearForm.setData('user_type', opt.value)}
                                            className="mt-0.5 text-red-600 focus:ring-red-500"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                                            <p className="text-xs text-gray-500">{opt.sub}</p>
                                        </div>
                                    </label>
                                ))}

                                {clearForm.errors.user_type && (
                                    <p className="text-xs text-red-500">{clearForm.errors.user_type}</p>
                                )}

                                {/* Confirmation prompt once a group is selected */}
                                {clearForm.data.user_type && (
                                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                                        <strong>Warning:</strong> You are about to permanently delete all requirement
                                        submissions for <strong>{userTypeLabel(clearForm.data.user_type)}</strong>.
                                        This action cannot be undone.
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                                <button
                                    type="button"
                                    onClick={() => { setShowClear(false); clearForm.reset(); }}
                                    className="btn-secondary btn-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!clearForm.data.user_type || clearForm.processing}
                                    className="btn-danger btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {clearForm.processing ? 'Clearing…' : 'Clear Submissions'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── File Preview Modal ──────────────────────────────────────────── */}
            {previewing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div>
                                <p className="font-semibold text-gray-900">{previewing.requirement_type?.name}</p>
                                <p className="text-xs text-gray-400">{previewing.user?.name} · {previewing.original_filename}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <a
                                    href={route('admin.requirements.file', previewing.id)}
                                    target="_blank" rel="noreferrer"
                                    className="btn-secondary btn-sm text-xs"
                                >
                                    Open in new tab
                                </a>
                                <button onClick={() => setPreviewing(null)} className="text-gray-400 hover:text-gray-600">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50 rounded-b-xl">
                            {isImage(previewing.original_filename) ? (
                                <img
                                    src={route('admin.requirements.file', previewing.id)}
                                    alt={previewing.original_filename}
                                    className="max-w-full max-h-[70vh] rounded shadow"
                                />
                            ) : isPdf(previewing.original_filename) ? (
                                <iframe
                                    src={route('admin.requirements.file', previewing.id)}
                                    className="w-full h-[70vh] rounded"
                                    title="PDF preview"
                                />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <p className="mb-3">Preview not available for this file type.</p>
                                    <a href={route('admin.requirements.file', previewing.id)} download className="btn-primary btn-sm">
                                        Download file
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Requirement Type Modal ──────────────────────────────────── */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-semibold mb-4">Add Requirement Type</h3>
                        <form onSubmit={submitAdd} className="space-y-3">
                            <div>
                                <label className="label">Name</label>
                                <input
                                    value={addForm.data.name}
                                    onChange={e => addForm.setData('name', e.target.value)}
                                    className="input"
                                    placeholder="e.g. X-ray Result"
                                />
                            </div>
                            <div>
                                <label className="label">Description</label>
                                <textarea
                                    value={addForm.data.description}
                                    onChange={e => addForm.setData('description', e.target.value)}
                                    className="input"
                                    rows={2}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" disabled={addForm.processing} className="btn-primary">Add</button>
                                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Review Modal ────────────────────────────────────────────────── */}
            {reviewing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-semibold mb-1">Review Submission</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {reviewing.user?.name} — {reviewing.requirement_type?.name}
                        </p>
                        <form onSubmit={submitReview} className="space-y-3">
                            <div className="flex gap-4">
                                {['approved', 'rejected'].map(s => (
                                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value={s}
                                            checked={reviewForm.data.status === s}
                                            onChange={() => reviewForm.setData('status', s)}
                                            className="text-clinic-600"
                                        />
                                        <span className="text-sm capitalize font-medium">{s}</span>
                                    </label>
                                ))}
                            </div>
                            {reviewForm.data.status === 'rejected' && (
                                <div>
                                    <label className="label">Rejection Reason</label>
                                    <textarea
                                        value={reviewForm.data.reason}
                                        onChange={e => reviewForm.setData('reason', e.target.value)}
                                        className="input"
                                        rows={2}
                                        required
                                    />
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button type="submit" disabled={reviewForm.processing} className="btn-primary">
                                    {reviewForm.processing ? 'Saving…' : 'Submit Review'}
                                </button>
                                <button type="button" onClick={() => setReviewing(null)} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
