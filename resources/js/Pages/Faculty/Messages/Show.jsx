import { Head, Link, useForm, usePage } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import { useEffect, useRef } from 'react';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function FacultyMessageShow({ conversation, messages }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, reset } = useForm({ body: '' });
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const submit = (e) => {
        e.preventDefault();
        if (!data.body.trim()) return;
        post(route('faculty.messages.reply', conversation.id), {
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

    const orderedMessages = [...(messages.data ?? [])].reverse();

    return (
        <FacultyLayout title={conversation.subject}>
            <Head title={conversation.subject} />

            <div className="flex flex-col h-full -m-6">

                {/* Back link + subject header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
                    <Link
                        href={route('faculty.messages.index')}
                        className="p-1.5 rounded-md text-gray-500 hover:text-clinic-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Link>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                            {conversation.subject}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                            {conversation.participants
                                ?.filter(p => p.id !== auth.user?.id)
                                .map(p => p.name)
                                .join(', ')}
                        </p>
                    </div>
                </div>

                {/* Message list */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                    {orderedMessages.map(msg => {
                        const isOwn = msg.sender_id === auth.user.id;
                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] sm:max-w-[65%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                                    {!isOwn && (
                                        <p className="text-xs text-gray-500 px-1">{msg.sender?.name}</p>
                                    )}
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                        isOwn
                                            ? 'bg-clinic-600 text-white rounded-br-sm'
                                            : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
                                    }`}>
                                        {msg.body}
                                    </div>
                                    <p className="text-[11px] text-gray-400 px-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Reply box */}
                <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
                    <form onSubmit={submit} className="flex gap-2 items-end">
                        <textarea
                            value={data.body}
                            onChange={e => setData('body', e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            className="input flex-1 resize-none"
                            placeholder="Type your reply…"
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
                    <p className="text-xs text-gray-400 mt-1.5 hidden sm:block">
                        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Enter</kbd> to send,{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Shift+Enter</kbd> for new line
                    </p>
                </div>
            </div>
        </FacultyLayout>
    );
}
