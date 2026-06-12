import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';

export default function MessagesShow({ conversation, messages }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, reset } = useForm({ body: '' });
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const submit = (e) => {
        e.preventDefault();
        if (!data.body.trim()) return;
        post(route('admin.messages.reply', conversation.id), {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit(e);
        }
    };

    const otherParticipant = conversation.participants?.find(p => p.id !== auth.user.id);
    const orderedMessages = [...(messages.data ?? [])].reverse();

    return (
        <AdminLayout title={otherParticipant?.name ?? conversation.subject}>
            <Head title={otherParticipant?.name ?? conversation.subject} />

            <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>

                {/* Back link */}
                <Link
                    href={route('admin.messages.index')}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-clinic-600 mb-4 self-start"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Messages
                </Link>

                <div className="card flex flex-col flex-1 overflow-hidden">

                    {/* Header — recipient avatar + name + subject */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                        <UserAvatar user={otherParticipant} size="md" className="flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                                {otherParticipant?.name ?? 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{conversation.subject}</p>
                        </div>
                    </div>

                    {/* Message list */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        {orderedMessages.map(msg => {
                            const isOwn = msg.sender_id === auth.user.id;
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    {!isOwn && (
                                        <UserAvatar user={msg.sender} size="sm" className="flex-shrink-0 mb-0.5" />
                                    )}
                                    <div className={`max-w-[70%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                                        {!isOwn && (
                                            <p className="text-xs text-gray-500 px-1">{msg.sender?.name}</p>
                                        )}
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                            isOwn
                                                ? 'bg-clinic-600 text-white rounded-br-sm'
                                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                        }`}>
                                            {msg.body}
                                        </div>
                                        <p className="text-[11px] text-gray-400 px-1">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {isOwn && (
                                        <UserAvatar user={auth.user} size="sm" className="flex-shrink-0 mb-0.5" />
                                    )}
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {/* Reply box */}
                    <div className="px-5 py-4 border-t border-gray-100">
                        <form onSubmit={submit} className="flex gap-2 items-end">
                            <textarea
                                value={data.body}
                                onChange={e => setData('body', e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                className="input flex-1 resize-none"
                                placeholder="Type your reply..."
                                style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
                                onInput={e => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                            />
                            <button
                                type="submit"
                                disabled={processing || !data.body.trim()}
                                className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-50"
                                title="Send"
                            >
                                <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                        </form>
                        <p className="text-xs text-gray-400 mt-1.5">
                            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Enter</kbd> to send,{' '}
                            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Shift+Enter</kbd> for new line
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
