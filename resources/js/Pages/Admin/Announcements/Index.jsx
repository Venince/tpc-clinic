import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AnnouncementsIndex({ announcements }) {
    const [modal, setModal] = useState(null);
    const { data, setData, post, put, processing, reset } = useForm({
        title: '', content: '', category: 'general', is_published: false, expires_at: ''
    });

    const open = (a) => {
        setModal(a || 'new');
        setData(a
            ? { title: a.title, content: a.content, category: a.category, is_published: a.is_published, expires_at: a.expires_at || '' }
            : { title: '', content: '', category: 'general', is_published: false, expires_at: '' }
        );
    };

    const submit = (e) => {
        e.preventDefault();
        if (modal === 'new') {
            post(route('admin.announcements.store'), { onSuccess: () => { setModal(null); reset(); } });
        } else {
            put(route('admin.announcements.update', modal.id), { onSuccess: () => { setModal(null); reset(); } });
        }
    };

    const del = (a) => { if (confirm('Delete announcement?')) router.delete(route('admin.announcements.destroy', a.id)); };

    const catBadge = (c) => ({ general: 'badge-blue', health: 'badge-green', event: 'badge-purple' })[c] || 'badge-gray';

    return (
        <AdminLayout title="Announcements">
            <Head title="Announcements" />

            {/* Page header — stacks on mobile */}
            <div className="page-header flex-wrap gap-y-3">
                <div>
                    <h2 className="page-title">Announcements</h2>
                </div>
                <button onClick={() => open(null)} className="btn-primary btn-sm w-full sm:w-auto justify-center">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    New Announcement
                </button>
            </div>

            <div className="card">
                <div className="divide-y divide-gray-100">
                    {announcements.data.map(a => (
                        <div key={a.id} className="px-4 sm:px-6 py-4">
                            {/* Top row: badges + actions */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                    <span className={`badge ${catBadge(a.category)} text-xs flex-shrink-0`}>{a.category}</span>
                                    {!a.is_published && <span className="badge badge-gray text-xs flex-shrink-0">Draft</span>}
                                </div>
                                {/* Action buttons always visible, right-aligned */}
                                <div className="flex gap-2 flex-shrink-0 ml-auto">
                                    <button
                                        onClick={() => open(a)}
                                        className="p-1.5 rounded-md text-gray-400 hover:text-clinic-600 hover:bg-gray-100 transition-colors"
                                        title="Edit"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => del(a)}
                                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        title="Delete"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Title */}
                            <p className="font-medium text-gray-900 text-sm sm:text-base leading-snug">{a.title}</p>

                            {/* Content preview */}
                            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{a.content}</p>

                            {/* Meta */}
                            <p className="text-xs text-gray-400 mt-1.5">
                                By {a.creator?.name} · {a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Not published'}
                            </p>
                        </div>
                    ))}

                    {!announcements.data.length && (
                        <div className="px-6 py-10 text-center text-gray-400">No announcements yet.</div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {modal !== null && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    {/* Sheet on mobile, centered dialog on sm+ */}
                    <div className="bg-white w-full sm:rounded-xl sm:max-w-lg shadow-xl max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h3 className="font-semibold text-gray-900">
                                {modal === 'new' ? 'New Announcement' : 'Edit Announcement'}
                            </h3>
                            <button
                                onClick={() => setModal(null)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="px-5 py-4 space-y-4">
                            <div>
                                <label className="label">Title</label>
                                <input
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className="input"
                                    placeholder="Announcement title"
                                />
                            </div>

                            <div>
                                <label className="label">Content</label>
                                <textarea
                                    value={data.content}
                                    onChange={e => setData('content', e.target.value)}
                                    className="input"
                                    rows={4}
                                    placeholder="Write your announcement..."
                                />
                            </div>

                            <div>
                                <label className="label">Category</label>
                                <select
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
                                    className="input"
                                >
                                    <option value="general">General</option>
                                    <option value="health">Health</option>
                                    <option value="event">Event</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Expires At <span className="text-gray-400 font-normal">(optional)</span></label>
                                <input
                                    type="datetime-local"
                                    value={data.expires_at}
                                    onChange={e => setData('expires_at', e.target.value)}
                                    className="input"
                                />
                            </div>

                            <div className="flex items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    id="pub"
                                    checked={data.is_published}
                                    onChange={e => setData('is_published', e.target.checked)}
                                    className="rounded text-clinic-600 w-4 h-4"
                                />
                                <label htmlFor="pub" className="text-sm text-gray-700 select-none cursor-pointer">
                                    Publish immediately
                                </label>
                            </div>

                            {/* Actions — full-width on mobile */}
                            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1 pb-1">
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="btn-secondary w-full sm:w-auto justify-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="btn-primary w-full sm:w-auto justify-center"
                                >
                                    {processing ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
