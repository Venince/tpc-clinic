import { Head, Link, router, useForm } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';
import { useState } from 'react';
import { PlusIcon, ChatBubbleLeftIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function StudentMessagesIndex({ conversations, contacts }) {
    const [recipientSearch, setRecipientSearch] = useState('');
    const [showContacts, setShowContacts] = useState(false);

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(recipientSearch.toLowerCase())
    );

    const [showNew, setShowNew] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({ recipient_id: '', subject: '', body: '' });
    const selectedContact = contacts.find(c => c.id == data.recipient_id);

    const submit = (e) => {
        e.preventDefault();
        post(route('student.messages.store'), { onSuccess: () => { setShowNew(false); reset(); setRecipientSearch(''); setShowContacts(false); } });
    };

    const handleDelete = () => {
        router.delete(route('student.messages.destroy', confirmDelete.id), {
            onSuccess: () => setConfirmDelete(null),
        });
    };

    return (
        <StudentLayout title="Messages">
            <Head title="Messages" />
            <div className="page-header">
                <h2 className="page-title">Messages</h2>
                <button onClick={() => setShowNew(true)} className="btn-primary btn-sm">
                    <PlusIcon className="w-4 h-4 mr-1" />New Message
                </button>
            </div>

            <div className="card">
                <div className="divide-y divide-gray-100">
                    {conversations.data?.map(c => (
                        <div key={c.id} className="flex items-center gap-2 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors group">
                            <Link href={route('student.messages.show', c.id)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-1 min-w-0 gap-1 sm:gap-0">
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{c.subject}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 truncate">{c.participants?.map(p => p.name).join(', ')}</p>
                                </div>
                                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right flex-shrink-0 sm:ml-3 gap-2 sm:gap-0">
                                    {c.unread > 0 && <span className="badge badge-red text-xs">{c.unread} new</span>}
                                    <p className="text-xs text-gray-400 sm:mt-1">{c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : ''}</p>
                                </div>
                            </Link>
                            <button
                                onClick={() => setConfirmDelete(c)}
                                className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                                title="Delete conversation"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {!conversations.data?.length && (
                        <div className="px-6 py-12 text-center">
                            <ChatBubbleLeftIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">No messages yet.</p>
                            <button onClick={() => setShowNew(true)} className="btn-primary btn-sm mt-3">Send a Message</button>
                        </div>
                    )}
                </div>
            </div>

            {/* New Message Modal */}
            {showNew && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="font-semibold mb-4">New Message to Clinic</h3>
                        <form onSubmit={submit} className="space-y-3">
                            <div className="relative">
                                <label className="label">To</label>
                                <input
                                    type="text"
                                    value={recipientSearch}
                                    onChange={e => {
                                        setRecipientSearch(e.target.value);
                                        setShowContacts(true);
                                        // Clear selection if user edits after picking
                                        if (selectedContact && e.target.value !== selectedContact.name) {
                                            setData('recipient_id', '');
                                        }
                                    }}
                                    onFocus={() => setShowContacts(true)}
                                    placeholder="Search by name or email…"
                                    className={`input ${errors.recipient_id ? 'input-error' : ''}`}
                                    autoComplete="off"
                                />
                                {/* Selected badge */}
                                {selectedContact && (
                                    <div className="mt-1 inline-flex items-center gap-1 bg-clinic-100 text-clinic-700 text-xs px-2 py-1 rounded-full">
                                        {selectedContact.name}
                                        <button type="button" onClick={() => { setData('recipient_id', ''); setRecipientSearch(''); }}
                                            className="ml-1 text-clinic-500 hover:text-clinic-800">✕</button>
                                    </div>
                                )}
                                {/* Dropdown */}
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
                                <input value={data.subject} onChange={e => setData('subject', e.target.value)} className="input" />
                                {errors.subject && <p className="error-msg">{errors.subject}</p>}
                            </div>
                            <div>
                                <label className="label">Message</label>
                                <textarea value={data.body} onChange={e => setData('body', e.target.value)} className="input" rows={4} />
                                {errors.body && <p className="error-msg">{errors.body}</p>}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button type="submit" disabled={processing} className="btn-primary flex-1 sm:flex-none">{processing ? 'Sending…' : 'Send'}</button>
                                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="font-semibold text-gray-900 mb-1">Delete Conversation?</h3>
                        <p className="text-sm text-gray-500 mb-5 break-words">
                            This will permanently delete "<span className="font-medium text-gray-700">{confirmDelete.subject}</span>" and all its messages. This cannot be undone.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={handleDelete} className="btn-danger flex-1">Yes, delete</button>
                            <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
}