import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef } from 'react';

const BUBBLE_COLORS = [
    'bg-blue-100 text-blue-900',
    'bg-purple-100 text-purple-900',
    'bg-amber-100 text-amber-900',
    'bg-teal-100 text-teal-900',
    'bg-pink-100 text-pink-900',
];

function getBubbleColor(senderId, participants) {
    const idx = participants.findIndex(p => p.id === senderId);
    return BUBBLE_COLORS[idx % BUBBLE_COLORS.length];
}

export default function MessageShow({ conversation, messages }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, reset } = useForm({ body: '' });
    const messagesEndRef = useRef(null);

    const participants = conversation.participants ?? [];
    const isGroup = participants.length > 2;

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const submit = (e) => {
        e.preventDefault();
        if (!data.body.trim()) return;
        post(route('admin.messages.reply', conversation.id), { onSuccess: () => reset() });
    };

    return (
        <AdminLayout title={conversation.subject}>
            <Head title={conversation.subject} />

            <div className="max-w-2xl mx-auto flex flex-col h-full">
                {/* Back link */}
                <Link
                    href={route('admin.messages.index')}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 self-start"
                >
                    <ArrowLeftIcon className="w-4 h-4" /> Back to Messages
                </Link>

                <div className="card flex flex-col overflow-hidden">
                    {/* Conversation header */}
                    <div className="card-header border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
                        <h2 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
                            {conversation.subject}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {isGroup
                                ? `Group: ${participants.map(p => p.name).join(', ')}`
                                : `With: ${participants.filter(p => p.id !== auth.user?.id).map(p => p.name).join(', ')}`
                            }
                        </p>
                    </div>

                    {/* Messages list — scrollable area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
                        style={{ maxHeight: 'calc(100dvh - 300px)', minHeight: '240px' }}>
                        {messages.data?.slice().reverse().map(msg => {
                            const isMine = msg.sender_id === auth.user?.id;
                            const bubbleColor = isMine
                                ? 'bg-clinic-600 text-white rounded-br-sm'
                                : `${getBubbleColor(msg.sender_id, participants)} rounded-bl-sm`;

                            return (
                                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] sm:max-w-sm px-3 sm:px-4 py-2.5 rounded-2xl text-sm ${bubbleColor}`}>
                                        {!isMine && (
                                            <p className="text-xs font-semibold mb-1 opacity-70">
                                                {msg.sender?.name}
                                            </p>
                                        )}
                                        <p className="break-words">{msg.body}</p>
                                        <p className={`text-xs mt-1 ${isMine ? 'text-clinic-200' : 'opacity-50'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply bar — sticky at bottom */}
                    <div className="p-3 sm:p-4 border-t border-gray-100 flex-shrink-0 bg-white">
                        <form onSubmit={submit} className="flex items-end gap-2">
                            <textarea
                                value={data.body}
                                onChange={e => setData('body', e.target.value)}
                                className="input flex-1 resize-none text-sm"
                                rows={2}
                                placeholder="Type your reply…"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        submit(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={processing || !data.body.trim()}
                                className="btn-primary flex-shrink-0 px-3 py-2.5 self-end"
                                title="Send"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </form>
                        <p className="text-xs text-gray-400 mt-1.5 hidden sm:block">
                            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">Enter</kbd> to send,{' '}
                            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">Shift+Enter</kbd> for new line
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
