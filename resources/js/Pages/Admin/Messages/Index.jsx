import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { PlusIcon, ChatBubbleLeftIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function MessagesIndex({ conversations, contacts }) {
    const [recipientSearch, setRecipientSearch] = useState('');
    const [showContacts, setShowContacts] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({ recipient_id: '', subject: '', body: '' });

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(recipientSearch.toLowerCase())
    );

    const selectedContact = contacts.find(c => c.id == data.recipient_id);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.messages.store'), {
            onSuccess: () => { setShowNew(false); reset(); setRecipientSearch(''); setShowContacts(false); }
        });
    };

    const handleDelete = () => {
        router.delete(route('admin.messages.destroy', confirmDelete.id), {
            onSuccess: () => setConfirmDelete(null),
        });
    };

    const closeNew = () => { setShowNew(false); reset(); setRecipientSearch(''); setShowContacts(false); };

    return (
        <AdminLayout title="Messages">
            <Head title="Messages" />

            {/* Page header */}
            <div className="page-header flex-wrap gap-y-3">
                <div><h2 className="page-title">Messages</h2></div>
                <button onClick={() => setShowNew(true)} className="btn-primary btn-sm w-full sm:w-auto justify-center">
                    <PlusIcon className="w-4 h-4 mr-1" />New Message
                </button>
            </div>

            <div className="card">
                <div className="divide-y divide-gray-100">
                    {conversations.data.map(c => (
                        <div key={c.id} className="flex items-center gap-2 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors group">
                            <Link href={route('admin.messages.show', c.id)} className="flex items-start gap-3 flex-1 min-w-0">
                                {/* Avatar */}
                                <div className="w-9 h-9 bg-clinic-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-clinic-700 font-semibold text-sm">
                                        {c.participants?.[0]?.name?.charAt(0)}
                                    </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                    {/* Subject + badge row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-medium text-gray-900 truncate text-sm sm:text-base leading-snug">
                                            {c.subject}
                                        </p>
                                        <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                                            {c.unread > 0 && (
                                                <span className="badge badge-red text-xs">{c.unread} new</span>
                                            )}
                                            <p className="text-xs text-gray-400 whitespace-nowrap">
                                                {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : ''}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Participants */}
                                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                                        {c.participants?.map(p => p.name).join(', ')}
                                    </p>
                                </div>
                            </Link>

                            {/* Delete — always visible on mobile, hover-only on desktop */}
                            <button
                                onClick={() => setConfirmDelete(c)}
                                className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                                title="Delete conversation"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {!conversations.data?.length && (
                        <div className="px-6 py-12 text-center">
                            <ChatBubbleLeftIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400">No conversations yet.</p>
                            <button onClick={() => setShowNew(true)} className="btn-primary btn-sm mt-3">
                                Start a Conversation
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* New Message Modal — bottom sheet on mobile */}
            {showNew && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="bg-white w-full sm:rounded-xl sm:max-w-md shadow-xl max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h3 className="font-semibold text-gray-900">New Message</h3>
                            <button
                                onClick={closeNew}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="px-5 py-4 space-y-4">
                            {/* Recipient */}
                            <div className="relative">
                                <label className="label">To</label>
                                <input
                                    type="text"
                                    value={recipientSearch}
                                    onChange={e => {
                                        setRecipientSearch(e.target.value);
                                        setShowContacts(true);
                                        if (selectedContact && e.target.value !== selectedContact.name) {
                                            setData('recipient_id', '');
                                        }
                                    }}
                                    onFocus={() => setShowContacts(true)}
                                    placeholder="Search by name or email…"
                                    className={`input ${errors.recipient_id ? 'input-error' : ''}`}
                                    autoComplete="off"
                                />
                                {selectedContact && (
                                    <div className="mt-1.5 inline-flex items-center gap-1 bg-clinic-100 text-clinic-700 text-xs px-2 py-1 rounded-full">
                                        {selectedContact.name}
                                        <button
                                            type="button"
                                            onClick={() => { setData('recipient_id', ''); setRecipientSearch(''); }}
                                            className="ml-1 text-clinic-500 hover:text-clinic-800"
                                        >✕</button>
                                    </div>
                                )}
                                {showContacts && recipientSearch && !selectedContact && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {filteredContacts.length > 0 ? filteredContacts.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onMouseDown={() => {
                                                    setData('recipient_id', c.id);
                                                    setRecipientSearch(c.name);
                                                    setShowContacts(false);
                                                }}
                                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                            >
                                                <p className="text-sm font-medium text-gray-900">{c.name}</p>
                                                <p className="text-xs text-gray-400">{c.email}</p>
                                            </button>
                                        )) : (
                                            <p className="px-4 py-3 text-sm text-gray-400">No contacts found.</p>
                                        )}
                                    </div>
                                )}
                                {errors.recipient_id && <p className="error-msg">{errors.recipient_id}</p>}
                            </div>

                            <div>
                                <label className="label">Subject</label>
                                <input
                                    value={data.subject}
                                    onChange={e => setData('subject', e.target.value)}
                                    className={`input ${errors.subject ? 'input-error' : ''}`}
                                    placeholder="What's this about?"
                                />
                                {errors.subject && <p className="error-msg">{errors.subject}</p>}
                            </div>

                            <div>
                                <label className="label">Message</label>
                                <textarea
                                    value={data.body}
                                    onChange={e => setData('body', e.target.value)}
                                    className={`input ${errors.body ? 'input-error' : ''}`}
                                    rows={4}
                                    placeholder="Write your message…"
                                />
                                {errors.body && <p className="error-msg">{errors.body}</p>}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1 pb-1">
                                <button type="button" onClick={closeNew} className="btn-secondary w-full sm:w-auto justify-center">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing} className="btn-primary w-full sm:w-auto justify-center">
                                    {processing ? 'Sending…' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="bg-white w-full sm:rounded-xl sm:max-w-sm shadow-xl rounded-t-2xl sm:rounded-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Delete Conversation?</h3>
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-5 py-4">
                            <p className="text-sm text-gray-500 mb-5">
                                This will permanently delete{' '}
                                <span className="font-medium text-gray-700">"{confirmDelete.subject}"</span>{' '}
                                and all its messages. This cannot be undone.
                            </p>
                            <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                                <button onClick={() => setConfirmDelete(null)} className="btn-secondary w-full justify-center">
                                    Cancel
                                </button>
                                <button onClick={handleDelete} className="btn-danger w-full justify-center">
                                    Yes, delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
