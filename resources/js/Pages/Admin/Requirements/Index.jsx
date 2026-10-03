import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import {
    PlusIcon, TrashIcon, CheckIcon, XMarkIcon,
    EyeIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';
import Modal from '@/Components/UI/Modal';

export default function RequirementsIndex({ types, people, pendingTotal = 0, programs, filters }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth?.user?.role?.name === 'super_admin';

    const [tab, setTab]               = useState('requirements');
    const [showAdd, setShowAdd]       = useState(false);
    const [reviewing, setReviewing]   = useState(null);
    const [previewing, setPreviewing] = useState(null);
    const [showClear, setShowClear]   = useState(false);
    const [search, setSearch]         = useState(filters?.search || '');
    const [status, setStatus]         = useState(filters?.status || '');
    const [programId, setProgramId]   = useState(filters?.program_id || '');
    const [expanded, setExpanded]   = useState({});

    const addForm = useForm({
        name:        '',
        description: '',
        is_required: false,
        program_id:  '',
        year_level:  '',
    });
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

    const toggleRequired = (type) => {
        router.put(route('admin.requirements.types.update', type.id), {
            is_required: !type.is_required,
        }, { preserveScroll: true });
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

    // ── Grouped-by-person helpers ─────────────────────────────────────────
    const toggleOpen = (id, current) => setExpanded(prev => ({ ...prev, [id]: !current }));
    const keepOpen   = (id) => setExpanded(prev => ({ ...prev, [id]: true }));

    const statusRank = (s) => (s === 'pending' ? 0 : s === 'rejected' ? 1 : 2);
    const sortItems  = (items = []) => [...items].sort((a, b) =>
        statusRank(a.approval_status) - statusRank(b.approval_status)
        || (a.requirement_type?.sort_order ?? 0) - (b.requirement_type?.sort_order ?? 0)
    );
    const countStatuses = (items = []) => items.reduce((acc, r) => {
        acc[r.approval_status] = (acc[r.approval_status] || 0) + 1;
        return acc;
    }, { pending: 0, approved: 0, rejected: 0 });

    const openReview = (r, person, newStatus) => {
        keepOpen(person.id);
        setReviewing({ ...r, user: person });
        reviewForm.setData('status', newStatus);
    };

    const approveAll = (person, pendingCount) => {
        const s = pendingCount !== 1 ? 's' : '';
        if (!confirm(`Approve all ${pendingCount} pending requirement${s} for ${person.name}?`)) return;
        keepOpen(person.id);
        router.post(route('admin.requirements.approve-all', person.id), {}, { preserveScroll: true });
    };

    const isImage = (f) => /\.(jpe?g|png|gif|webp)$/i.test(f || '');
    const isPdf   = (f) => /\.pdf$/i.test(f || '');

    return (
        <AdminLayout title="Medical Requirements">
            <Head title="Requirements" />

            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <p className="page-subtitle">Manage requirement types and review student/faculty submissions</p>
                </div>
                {tab === 'requirements' && (
                    <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm whitespace-nowrap flex items-center gap-1">
                        <PlusIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Type</span>
                    </button>
                )}
                {tab === 'submissions' && isSuperAdmin && (
                    <button onClick={() => setShowClear(true)} className="btn-danger btn-sm whitespace-nowrap flex items-center gap-1">
                        <TrashIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Clear Submissions</span>
                    </button>
                )}
            </div>

            {/* Content Tabs — Requirements vs Submissions */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
                {[['requirements', 'Requirements'], ['submissions', 'Submissions']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            tab === key
                                ? 'border-clinic-600 text-clinic-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}>
                        {label}
                        {key === 'submissions' && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                {people?.total || 0}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Requirements Tab */}
            {tab === 'requirements' && (
                <div className="card mb-6">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900">Requirement Types</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Required types must be uploaded by students before they can access the portal.
                        </p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {types.map(t => (
                            <div key={t.id} className="px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-gray-900 break-words">{t.name}</p>
                                        {t.is_required && (
                                            <span className="badge badge-red text-[10px] px-1.5 py-0.5 flex-shrink-0">Required</span>
                                        )}
                                        {t.program ? (
                                            <span className="badge badge-blue text-[10px] px-1.5 py-0.5 flex-shrink-0">
                                                {t.program.code}{t.year_level ? ` · Year ${t.year_level}` : ''}
                                            </span>
                                        ) : t.year_level ? (
                                            <span className="badge badge-blue text-[10px] px-1.5 py-0.5 flex-shrink-0">
                                                Year {t.year_level} (All Programs)
                                            </span>
                                        ) : (
                                            <span className="badge badge-gray text-[10px] px-1.5 py-0.5 flex-shrink-0">All Students</span>
                                        )}
                                    </div>
                                    {t.description && <p className="text-xs text-gray-400 break-words">{t.description}</p>}
                                    <p className="text-xs text-gray-400 mt-0.5">{t.user_requirements_count} submissions</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-center">
                                    {/* Required toggle */}
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none" title={t.is_required ? 'Mark as optional' : 'Mark as required'}>
                                        <span className="text-xs text-gray-500 hidden sm:inline">
                                            {t.is_required ? 'Required' : 'Optional'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toggleRequired(t)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                                t.is_required ? 'bg-red-500' : 'bg-gray-200'
                                            }`}
                                            aria-label="Toggle required"
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                                t.is_required ? 'translate-x-4' : 'translate-x-1'
                                            }`} />
                                        </button>
                                    </label>
                                    <button
                                        onClick={() => { if (confirm('Delete this requirement type?')) router.delete(route('admin.requirements.types.destroy', t.id)); }}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {!types.length && (
                            <div className="px-6 py-6 text-center text-gray-400 text-sm">No requirement types.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Submissions Tab */}
            {tab === 'submissions' && (
                <>
                    {/* Filters */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                <div className="flex-1 min-w-0">
                                    <label className="label" htmlFor="filter-search">Search</label>
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            id="filter-search"
                                            name="filter-search"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                            className="input pl-9"
                                            placeholder="Search by name or email…"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <div>
                                        <label className="label" htmlFor="filter-status">Status</label>
                                        <select id="filter-status" name="filter-status" value={status} onChange={e => setStatus(e.target.value)} className="input w-full sm:w-auto">
                                            <option value="">All Statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label" htmlFor="filter-program">Program</label>
                                        <select id="filter-program" name="filter-program" value={programId} onChange={e => setProgramId(e.target.value)} className="input w-full sm:w-auto">
                                            <option value="">All Programs</option>
                                            {programs.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <button onClick={applyFilters} className="btn-primary btn-sm">Filter</button>
                                        {(search || status || programId) && (
                                            <button onClick={clearFilters} className="btn-secondary btn-sm">Clear</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submissions — one card per person */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Submissions</h3>
                        <span className="text-xs text-gray-400">
                            {people.total} {people.total === 1 ? 'person' : 'people'}
                            {pendingTotal > 0 && <> · {pendingTotal} pending</>}
                        </span>
                    </div>

                    <div className="space-y-3 mb-4">
                        {people.data.map(p => {
                            const items      = sortItems(p.requirements);
                            const counts     = countStatuses(items);
                            const open       = expanded[p.id] ?? counts.pending > 0;
                            const isFaculty  = p.role?.name === 'faculty_staff';
                            const program    = p.student_profile?.program?.code;

                            return (
                                <div key={p.id} className="card overflow-hidden">
                                    {/* Person header */}
                                    <div className="p-4">
                                        <div className="flex items-start gap-3 cursor-pointer" onClick={() => toggleOpen(p.id, open)}>
                                            <UserAvatar user={p} size="sm" className="flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{p.email}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={e => { e.stopPropagation(); toggleOpen(p.id, open); }}
                                                aria-expanded={open}
                                                aria-label={open ? 'Collapse requirements' : 'Expand requirements'}
                                                className="p-1.5 -mr-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
                                            >
                                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                            {isFaculty
                                                ? <span className="badge badge-purple">Faculty / Staff</span>
                                                : program && <span className="badge badge-blue">{program}</span>}
                                            <span className="text-xs text-gray-400 mr-1">{items.length} submitted</span>
                                            {counts.pending  > 0 && <span className="badge badge-yellow">{counts.pending} pending</span>}
                                            {counts.approved > 0 && <span className="badge badge-green">{counts.approved} approved</span>}
                                            {counts.rejected > 0 && <span className="badge badge-red">{counts.rejected} rejected</span>}
                                        </div>

                                        {counts.pending > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => approveAll(p, counts.pending)}
                                                className="btn-success btn-sm w-full sm:w-auto mt-3 flex items-center justify-center gap-1"
                                            >
                                                <CheckIcon className="w-4 h-4" /> Approve all pending ({counts.pending})
                                            </button>
                                        )}
                                    </div>

                                    {/* Requirements of this person */}
                                    {open && (
                                        <div className="border-t border-gray-100 divide-y divide-gray-100">
                                            {items.map(r => (
                                                <div key={r.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="text-sm font-medium text-gray-900 break-words">
                                                                {r.requirement_type?.name || 'Removed requirement'}
                                                            </p>
                                                            {r.requirement_type?.is_required && (
                                                                <span className="badge badge-red text-[10px]">Required</span>
                                                            )}
                                                            {statusBadge(r.approval_status)}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-400">
                                                            {r.file_path ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPreviewing({ ...r, user: p })}
                                                                    className="flex items-start gap-1 text-clinic-600 hover:text-clinic-800 font-medium min-w-0 text-left"
                                                                >
                                                                    <EyeIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                                    <span className="break-all">{r.original_filename || 'View file'}</span>
                                                                </button>
                                                            ) : (
                                                                <span>No file</span>
                                                            )}
                                                            <span>Uploaded {new Date(r.created_at).toLocaleDateString()}</span>
                                                        </div>

                                                        {r.approval_status === 'rejected' && r.rejection_reason && (
                                                            <p className="text-xs text-red-500 mt-1 break-words">Reason: {r.rejection_reason}</p>
                                                        )}
                                                        {r.approval_status !== 'pending' && r.reviewer?.name && (
                                                            <p className="text-xs text-gray-400 italic mt-0.5">Reviewed by {r.reviewer.name}</p>
                                                        )}
                                                    </div>

                                                    {r.approval_status === 'pending' ? (
                                                        <div className="flex gap-2 sm:flex-shrink-0">
                                                            <button onClick={() => openReview(r, p, 'approved')}
                                                                className="btn-success btn-sm flex-1 sm:flex-none flex items-center justify-center gap-1">
                                                                <CheckIcon className="w-4 h-4" /> Approve
                                                            </button>
                                                            <button onClick={() => openReview(r, p, 'rejected')}
                                                                className="btn-danger btn-sm flex-1 sm:flex-none flex items-center justify-center gap-1">
                                                                <XMarkIcon className="w-4 h-4" /> Reject
                                                            </button>
                                                        </div>
                                                    ) : isSuperAdmin && (
                                                        <div className="sm:flex-shrink-0">
                                                            <button
                                                                onClick={() => { if (confirm('Permanently delete this submission and its uploaded file? This cannot be undone.')) router.delete(route('admin.requirements.destroy', r.id), { preserveScroll: true }); }}
                                                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
                                                                title="Delete submission"
                                                            >
                                                                <TrashIcon className="w-3.5 h-3.5" /> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {!people.data?.length && (
                            <div className="card p-8 text-center text-gray-400">No submissions found.</div>
                        )}
                    </div>

                    {/* Pagination */}
                    {people.links?.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-1 mt-3">
                            {people.links.map((link, i) => (
                                <button key={i} disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, { search, status, program_id: programId })}
                                    className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-clinic-600 text-white' : 'hover:bg-gray-100 text-gray-600'} disabled:opacity-40`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Add Requirement Type Modal */}
            {showAdd && (
                <Modal onClose={() => { setShowAdd(false); addForm.reset(); }} size="md">
                    <div className="p-6">
                        <h3 className="font-semibold mb-4">Add Requirement Type</h3>
                        <form onSubmit={submitAdd} className="space-y-3">
                            <div>
                                <label className="label" htmlFor="reqtype-name">Name</label>
                                <input id="reqtype-name" name="name" autoComplete="off" value={addForm.data.name} onChange={e => addForm.setData('name', e.target.value)}
                                    className="input" placeholder="e.g. X-ray Result" />
                                {addForm.errors.name && <p className="error-msg">{addForm.errors.name}</p>}
                            </div>
                            <div>
                                <label className="label" htmlFor="reqtype-description">Description</label>
                                <textarea id="reqtype-description" name="description" value={addForm.data.description} onChange={e => addForm.setData('description', e.target.value)}
                                    className="input" rows={2} />
                            </div>

                            {/* Targeting */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label" htmlFor="reqtype-program">Program <span className="text-gray-400 font-normal">(optional)</span></label>
                                    <select id="reqtype-program" name="program_id" value={addForm.data.program_id} onChange={e => addForm.setData('program_id', e.target.value)} className="input">
                                        <option value="">All Programs</option>
                                        {programs.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                                    </select>
                                    {addForm.errors.program_id && <p className="error-msg">{addForm.errors.program_id}</p>}
                                </div>
                                <div>
                                    <label className="label" htmlFor="reqtype-year">Year Level <span className="text-gray-400 font-normal">(optional)</span></label>
                                    <select id="reqtype-year" name="year_level" value={addForm.data.year_level} onChange={e => addForm.setData('year_level', e.target.value)} className="input">
                                        <option value="">All Years</option>
                                        {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                                    </select>
                                    {addForm.errors.year_level && <p className="error-msg">{addForm.errors.year_level}</p>}
                                </div>
                            </div>

                            {/* Scope summary */}
                            <p className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">
                                {!addForm.data.program_id && !addForm.data.year_level
                                    ? 'Applies to all students.'
                                    : `Applies to ${addForm.data.program_id ? programs.find(p => p.id == addForm.data.program_id)?.code ?? 'selected program' : 'all programs'}${addForm.data.year_level ? `, Year ${addForm.data.year_level}` : ''} students only.`
                                }
                            </p>

                            {/* is_required toggle */}
                            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Required for onboarding</p>
                                    <p className="text-xs text-gray-400">Targeted students must upload this before accessing the portal.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addForm.setData('is_required', !addForm.data.is_required)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                        addForm.data.is_required ? 'bg-red-500' : 'bg-gray-200'
                                    }`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                        addForm.data.is_required ? 'translate-x-4' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button type="submit" disabled={addForm.processing} className="btn-primary flex-1">Add</button>
                                <button type="button" onClick={() => { setShowAdd(false); addForm.reset(); }} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            {/* Clear Submissions Modal */}
            {showClear && (
                <Modal onClose={() => { setShowClear(false); clearForm.reset(); }} size="md">
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
                    <form onSubmit={submitClear}>
                        <div className="px-6 pb-5 space-y-3">
                            <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Select user group to clear</p>
                            {[
                                { value: 'student',       label: 'Students only',             sub: 'Clears all student requirement submissions.' },
                                { value: 'faculty_staff', label: 'Faculty / Staff only',       sub: 'Clears all faculty and staff submissions.' },
                                { value: 'both',          label: 'Students & Faculty / Staff', sub: 'Clears every submission across all users.' },
                            ].map(opt => (
                                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    clearForm.data.user_type === opt.value ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}>
                                    <input type="radio" name="user_type" value={opt.value}
                                        checked={clearForm.data.user_type === opt.value}
                                        onChange={() => clearForm.setData('user_type', opt.value)}
                                        className="mt-0.5 text-red-600 focus:ring-red-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                                        <p className="text-xs text-gray-500">{opt.sub}</p>
                                    </div>
                                </label>
                            ))}
                            {clearForm.errors.user_type && <p className="text-xs text-red-500">{clearForm.errors.user_type}</p>}
                            {clearForm.data.user_type && (
                                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                                    <strong>Warning:</strong> You are about to permanently delete all requirement
                                    submissions for <strong>{userTypeLabel(clearForm.data.user_type)}</strong>.
                                    This action cannot be undone.
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                            <button type="button" onClick={() => { setShowClear(false); clearForm.reset(); }} className="btn-secondary btn-sm">Cancel</button>
                            <button type="submit" disabled={!clearForm.data.user_type || clearForm.processing}
                                className="btn-danger btn-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                {clearForm.processing ? 'Clearing…' : 'Clear Submissions'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* File Preview Modal */}
            {previewing && (
                <Modal onClose={() => setPreviewing(null)} size="lg">
                    <div className="flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-gray-100">
                            <div className="min-w-0 mr-3">
                                <p className="font-semibold text-gray-900 truncate">{previewing.requirement_type?.name}</p>
                                <p className="text-xs text-gray-400 truncate">{previewing.user?.name} · {previewing.original_filename}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a href={route('admin.requirements.file', previewing.id)} target="_blank" rel="noreferrer"
                                    className="btn-secondary btn-sm text-xs hidden sm:inline-flex">
                                    Open in new tab
                                </a>
                                <button onClick={() => setPreviewing(null)} className="text-gray-400 hover:text-gray-600">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
                            {isImage(previewing.original_filename) ? (
                                <img src={route('admin.requirements.file', previewing.id)} alt={previewing.original_filename}
                                    className="max-w-full max-h-[70vh] rounded shadow" />
                            ) : isPdf(previewing.original_filename) ? (
                                <iframe src={route('admin.requirements.file', previewing.id)}
                                    className="w-full h-[70vh] rounded" title="PDF preview" />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <p className="mb-3">Preview not available for this file type.</p>
                                    <a href={route('admin.requirements.file', previewing.id)} download className="btn-primary btn-sm">Download file</a>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Review Modal */}
            {reviewing && (
                <Modal onClose={() => setReviewing(null)} size="md">
                    <div className="p-6">
                        <h3 className="font-semibold mb-1">Review Submission</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {reviewing.user?.name} — {reviewing.requirement_type?.name}
                        </p>
                        <form onSubmit={submitReview} className="space-y-3">
                            <div className="flex gap-4">
                                {['approved', 'rejected'].map(s => (
                                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="review_status" value={s} checked={reviewForm.data.status === s}
                                            onChange={() => reviewForm.setData('status', s)} className="text-clinic-600" />
                                        <span className="text-sm capitalize font-medium">{s}</span>
                                    </label>
                                ))}
                            </div>
                            {reviewForm.data.status === 'rejected' && (
                                <div>
                                    <label className="label" htmlFor="rejection-reason">Rejection Reason</label>
                                    <textarea id="rejection-reason" name="rejection-reason" value={reviewForm.data.reason} onChange={e => reviewForm.setData('reason', e.target.value)}
                                        className="input" rows={2} required />
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button type="submit" disabled={reviewForm.processing} className="btn-primary flex-1">
                                    {reviewForm.processing ? 'Saving…' : 'Submit Review'}
                                </button>
                                <button type="button" onClick={() => setReviewing(null)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
