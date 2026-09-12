import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState, useRef, useEffect } from 'react';
import {
    PlusIcon, PencilIcon, TrashIcon, XMarkIcon,
    EllipsisHorizontalIcon, GlobeAltIcon, LockClosedIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/Components/UI/Modal';

const CATEGORY_STYLES = {
    general: { label: 'General', className: 'bg-blue-50 text-blue-700' },
    health:  { label: 'Health',  className: 'bg-green-50 text-green-700' },
    event:   { label: 'Event',   className: 'bg-purple-50 text-purple-700' },
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString(undefined, {
        month: 'short', day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
}

export default function AnnouncementsIndex({ announcements }) {
    const [modal, setModal]       = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const menuRef = useRef(null);

    const { data, setData, post, put, processing, reset } = useForm({
        title: '', content: '', category: 'general', is_published: false, expires_at: ''
    });

    useEffect(() => {
        const closeOnOutsideClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
        };
        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    const open = (a) => {
        setModal(a || 'new');
        setOpenMenu(null);
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

    const del = (a) => {
        setOpenMenu(null);
        if (confirm('Delete announcement?')) router.delete(route('admin.announcements.destroy', a.id));
    };

    return (
        <AdminLayout title="Announcements">
            <Head title="Announcements" />

            <div className="max-w-2xl mx-auto">
                {/* Composer bar */}
                <div className="card p-3 sm:p-4 mb-4 flex items-center gap-3">
                    <img src="/images/tpc-logo.png" alt="TPC e-Clinic" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100" />
                    <button
                        onClick={() => open(null)}
                        className="flex-1 text-left px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm text-gray-500 transition-colors"
                    >
                        Post an announcement…
                    </button>
                    <button onClick={() => open(null)} className="btn-primary btn-sm flex-shrink-0 hidden sm:flex">
                        <PlusIcon className="w-4 h-4 mr-1" /> New
                    </button>
                </div>

                {/* Feed */}
                <div className="space-y-4">
                    {announcements.data.map(a => {
                        const cat = CATEGORY_STYLES[a.category] || { label: a.category, className: 'bg-gray-100 text-gray-600' };
                        return (
                            <div key={a.id} className="card overflow-visible">
                                {/* Post header */}
                                <div className="flex items-start justify-between px-4 sm:px-5 pt-4 pb-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img src="/images/tpc-logo.png" alt="TPC e-Clinic" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100" />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">TPC e-Clinic</p>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <span>{a.is_published ? timeAgo(a.published_at) : 'Draft'}</span>
                                                <span>·</span>
                                                {a.is_published
                                                    ? <GlobeAltIcon className="w-3 h-3" title="Published" />
                                                    : <LockClosedIcon className="w-3 h-3" title="Draft — not visible to users" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kebab menu */}
                                    <div className="relative flex-shrink-0" ref={openMenu === a.id ? menuRef : null}>
                                        <button
                                            onClick={() => setOpenMenu(openMenu === a.id ? null : a.id)}
                                            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                            aria-label="Post options"
                                        >
                                            <EllipsisHorizontalIcon className="w-5 h-5" />
                                        </button>
                                        {openMenu === a.id && (
                                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                                <button onClick={() => open(a)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                    <PencilIcon className="w-4 h-4" /> Edit post
                                                </button>
                                                <button onClick={() => del(a)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                                    <TrashIcon className="w-4 h-4" /> Delete post
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Post body */}
                                <div className="px-4 sm:px-5 pb-2">
                                    <p className="font-semibold text-gray-900 text-[15px] leading-snug mb-1">{a.title}</p>
                                    <p className="text-gray-700 text-sm whitespace-pre-line">{a.content}</p>
                                </div>

                                {/* Footer: category pill + expiry note */}
                                <div className="px-4 sm:px-5 pb-4 pt-2 mt-1 flex flex-wrap items-center gap-2 border-t border-gray-50">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cat.className}`}>{cat.label}</span>
                                    {a.expires_at && (
                                        <span className="text-xs text-gray-400">
                                            Expires {new Date(a.expires_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {!announcements.data.length && (
                        <div className="card px-6 py-14 text-center text-gray-400">No announcements yet.</div>
                    )}
                </div>

                {/* Pagination */}
                {announcements.links?.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-6">
                        {announcements.links.map((link, i) => (
                            <button key={i} disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-clinic-600 text-white' : 'hover:bg-gray-100 text-gray-600'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating "new" button on mobile */}
            <button
                onClick={() => open(null)}
                className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-clinic-600 text-white shadow-lg flex items-center justify-center hover:bg-clinic-700 transition-colors z-30"
                aria-label="New announcement"
            >
                <PlusIcon className="w-6 h-6" />
            </button>

            {/* Modal */}
            {modal !== null && (
                <Modal onClose={() => setModal(null)} size="lg">
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
                            <label className="label" htmlFor="announcement-title">Title</label>
                            <input
                                id="announcement-title"
                                name="title"
                                autoComplete="off"
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                className="input"
                                placeholder="Announcement title"
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="announcement-content">Content</label>
                            <textarea
                                id="announcement-content"
                                name="content"
                                value={data.content}
                                onChange={e => setData('content', e.target.value)}
                                className="input"
                                rows={4}
                                placeholder="Write your announcement..."
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="announcement-category">Category</label>
                            <select
                                id="announcement-category"
                                name="category"
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
                            <label className="label" htmlFor="announcement-expires-at">Expires At <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input
                                id="announcement-expires-at"
                                name="expires_at"
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
                                name="is_published"
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
                </Modal>
            )}
        </AdminLayout>
    );
}
