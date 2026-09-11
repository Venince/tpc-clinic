import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';
import { useState } from 'react';
import { PlusIcon, ChatBubbleLeftIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';
import Modal from '@/Components/UI/Modal';

export default function StudentMessagesIndex({ conversations, contacts }) {
    const { auth } = usePage().props;
    const [conversationSearch, setConversationSearch] = useState('');
    const [recipientSearch, setRecipientSearch] = useState('');
    const [showContacts, setShowContacts] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({ recipient_id: '', body: '' });

    // Client-side filter by recipient name or last message text
    const filteredConversations = conversations.data.filter(c => {
        const q = conversationSearch.toLowerCase();
        if (!q) return true;
        const other = c.participants?.find(p => p.id !== auth.user.id);
        const lastMessage = c.messages?.[0]?.body;
        return (
            other?.name?.toLowerCase().includes(q) ||
            lastMessage?.toLowerCase().includes(q)
        );
    });

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(recipientSearch.toLowerCase())
    );

    const selectedContact = contacts.find(c => c.id == data.recipient_id);

    const submit = (e) => {
        e.preventDefault();
        post(route('student.messages.store'), {
            onSuccess: () => { setShowNew(false); reset(); setRecipientSearch(''); setShowContacts(false); }
        });
    };

    const handleDelete = () => {
        router.delete(route('student.messages.destroy', confirmDelete.id), {
            onSuccess: () => setConfirmDelete(null),
        });
    };

    const closeNew = () => { setShowNew(false); reset(); setRecipientSearch(''); setShowContacts(false); };

    return (
        <StudentLayout title="Messages">
            <Head title="Messages" />

            {/* Page header */}
            <div className="page-header flex-wrap gap-y-3">
                <div><h2 className="page-title">Messages</h2></div>
                <button onClick={() => setShowNew(true)} className="btn-primary btn-sm w-full sm:w-auto justify-center">
                    <PlusIcon className="w-4 h-4 mr-1" />New Message
                </button>
            </div>

            <div className="card">
                {/* Search bar */}
                <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            id="conversation-search"
                            name="conversation-search"
                            value={conversationSearch}
                            onChange={e => setConversationSearch(e.target.value)}
                            className="input pl-9 w-full"
                            placeholder="Search by name or message…"
                        />
                        {conversationSearch && (
                            <button
                                onClick={() => setConversationSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {filteredConversations.map(c => {
                        const other = c.participants?.find(p => p.id !== auth.user.id) ?? c.participants?.[0];
                        const lastMessage = c.messages?.[0];
                        const preview = lastMessage
                            ? `${lastMessage.sender_id === auth.user.id ? 'You: ' : ''}${lastMessage.body}`
                            : 'No messages yet';
                        return (
                            <div key={c.id} className="flex items-center gap-2 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors group">
                                <Link href={route('student.messages.show', c.id)} className="flex items-start gap-3 flex-1 min-w-0">
                                    {/* Recipient avatar */}
                                    <UserAvatar user={other} size="md" className="mt-0.5 flex-shrink-0" />

                                    <div className="min-w-0 flex-1">
                                        {/* Recipient name as conversation title, last message as preview */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className={`truncate text-sm sm:text-base leading-snug ${c.unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                                                    {other?.name ?? 'Unknown'}
                                                </p>
                                                <p className={`text-xs truncate ${c.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                                                    {preview}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                                                {c.unread > 0 && (
                                                    <span className="badge badge-red text-xs">{c.unread} new</span>
                                                )}
                                                <p className="text-xs text-gray-400 whitespace-nowrap">
                                                    {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Delete */}
                                <button
                                    onClick={() => setConfirmDelete(c)}
                                    className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                                    title="Delete conversation"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}

                    {!filteredConversations.length && (
                        <div className="px-6 py-12 text-center">
                            <ChatBubbleLeftIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400">
                                {conversationSearch ? `No conversations match "${conversationSearch}".` : 'No conversations yet.'}
                            </p>
                            {!conversationSearch && (
                                <button onClick={() => setShowNew(true)} className="btn-primary btn-sm mt-3">
                                    Start a Conversation
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* New Message Modal */}
            {showNew && (
                <Modal onClose={closeNew} size="md">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <h3 className="font-semibold text-gray-900">New Message to Clinic</h3>
                        <button onClick={closeNew} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="px-5 py-4 space-y-4">
                        {/* Recipient */}
                        <div className="relative">
                            <label className="label" htmlFor="recipient-search">To</label>
                            <input
                                id="recipient-search"
                                name="recipient-search"
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
                                    <button type="button" onClick={() => { setData('recipient_id', ''); setRecipientSearch(''); }} className="ml-1 text-clinic-500 hover:text-clinic-800">✕</button>
                                </div>
                            )}
                            {showContacts && recipientSearch && !selectedContact && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredContacts.length > 0 ? filteredContacts.map(c => (
                                        <button key={c.id} type="button"
                                            onMouseDown={() => { setData('recipient_id', c.id); setRecipientSearch(c.name); setShowContacts(false); }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                                        >
                                            <UserAvatar user={c} size="xs" className="flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{c.name}</p>
                                                <p className="text-xs text-gray-400">{c.email}</p>
                                            </div>
                                        </button>
                                    )) : (
                                        <p className="px-4 py-3 text-sm text-gray-400">No contacts found.</p>
                                    )}
                                </div>
                            )}
                            {errors.recipient_id && <p className="error-msg">{errors.recipient_id}</p>}
                        </div>

                        <div>
                            <label className="label" htmlFor="new-message-body">Message</label>
                            <textarea id="new-message-body" name="body" value={data.body} onChange={e => setData('body', e.target.value)} className={`input ${errors.body ? 'input-error' : ''}`} rows={4} placeholder="Write your message…" />
                            {errors.body && <p className="error-msg">{errors.body}</p>}
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1 pb-1">
                            <button type="button" onClick={closeNew} className="btn-secondary w-full sm:w-auto justify-center">Cancel</button>
                            <button type="submit" disabled={processing} className="btn-primary w-full sm:w-auto justify-center">{processing ? 'Sending…' : 'Send'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <Modal onClose={() => setConfirmDelete(null)} size="sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Delete Conversation?</h3>
                        <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="px-5 py-4">
                        <p className="text-sm text-gray-500 mb-5">
                            This will delete your conversation with{' '}
                            <span className="font-medium text-gray-700">
                                {confirmDelete.participants?.find(p => p.id !== auth.user.id)?.name ?? 'this person'}
                            </span>. They'll keep their copy, and if you message them again it'll start fresh — this conversation's messages won't come back.
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                            <button onClick={() => setConfirmDelete(null)} className="btn-secondary w-full justify-center">Cancel</button>
                            <button onClick={handleDelete} className="btn-danger w-full justify-center">Yes, delete</button>
                        </div>
                    </div>
                </Modal>
            )}
        </StudentLayout>
    );
}
