import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import { useEffect, useRef, useState } from 'react';
import {
    ArrowLeftIcon,
    PaperAirplaneIcon,
    EllipsisVerticalIcon,
    TrashIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';

export default function FacultyMessageShow({ conversation, messages }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, reset } = useForm({ body: '' });
    const bottomRef = useRef(null);
    const menuRef = useRef(null);

    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuStage, setMenuStage] = useState('root'); // 'root' | 'choices'

    const otherParticipant = conversation.participants?.find(p => p.id !== auth.user.id);
    const orderedMessages = [...(messages.data ?? [])].reverse();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const closeMenu = () => {
        setOpenMenuId(null);
        setMenuStage('root');
    };

    const toggleMenu = (id) => {
        if (openMenuId === id) {
            closeMenu();
        } else {
            setOpenMenuId(id);
            setMenuStage('root');
        }
    };

    useEffect(() => {
        if (!openMenuId) return;
        const handleOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu();
        };
        const handleEscape = (e) => { if (e.key === 'Escape') closeMenu(); };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [openMenuId]);

    const handleDelete = (msg, mode) => {
        router.delete(route('faculty.messages.destroyMessages', conversation.id), {
            data: { message_ids: [msg.id], mode },
            preserveScroll: true,
            onSuccess: closeMenu,
        });
    };

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

    return (
        <FacultyLayout title={otherParticipant?.name ?? 'Conversation'}>
            <Head title={otherParticipant?.name ?? 'Conversation'} />

            {/* -m-6 cancels the layout's p-6 so we can go full-height edge-to-edge */}
            <div className="flex flex-col h-full -m-4 sm:-m-6">

                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
                    <Link
                        href={route('faculty.messages.index')}
                        className="p-1.5 rounded-md text-gray-500 hover:text-clinic-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Link>
                    <UserAvatar user={otherParticipant} size="sm" className="flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                            {otherParticipant?.name ?? 'Unknown'}
                        </p>
                    </div>
                </div>

                {/* Message list — extra bottom padding on mobile clears the fixed reply box below */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 pt-4 pb-24 lg:pb-4 space-y-4 bg-gray-50">
                    {orderedMessages.map(msg => {
                        const isOwn = msg.sender_id === auth.user.id;
                        const isMenuOpen = openMenuId === msg.id;

                        return (
                            <div key={msg.id} className={`flex items-end gap-1 sm:gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                {isOwn && (
                                    <MessageKebab
                                        isOwn={isOwn}
                                        isOpen={isMenuOpen}
                                        stage={menuStage}
                                        menuRef={isMenuOpen ? menuRef : null}
                                        onToggle={() => toggleMenu(msg.id)}
                                        onOpenChoices={() => setMenuStage('choices')}
                                        onBack={() => setMenuStage('root')}
                                        onDelete={(mode) => handleDelete(msg, mode)}
                                    />
                                )}
                                {!isOwn && (
                                    <UserAvatar user={msg.sender} size="sm" className="flex-shrink-0 mb-0.5" />
                                )}
                                <div className={`max-w-[78%] sm:max-w-[65%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
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
                                {isOwn && (
                                    <UserAvatar user={auth.user} size="sm" className="flex-shrink-0 mb-0.5" />
                                )}
                                {!isOwn && (
                                    <MessageKebab
                                        isOwn={isOwn}
                                        isOpen={isMenuOpen}
                                        stage={menuStage}
                                        menuRef={isMenuOpen ? menuRef : null}
                                        onToggle={() => toggleMenu(msg.id)}
                                        onOpenChoices={() => setMenuStage('choices')}
                                        onBack={() => setMenuStage('root')}
                                        onDelete={(mode) => handleDelete(msg, mode)}
                                    />
                                )}
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Reply box — fixed to the real viewport bottom on mobile, back in normal flow on desktop */}
                <div className="fixed inset-x-0 bottom-0 z-30 lg:static lg:inset-auto lg:z-auto px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-3 bg-white border-t border-gray-200 flex-shrink-0">
                    <form onSubmit={submit} className="flex gap-2 items-end">
                        <textarea
                            id="reply-body"
                            name="body"
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

/**
 * Small kebab (⋮) button next to a message bubble. Tapping it opens a
 * two-step popup: "Delete" first, then "Delete for Everyone" (senders
 * only) / "Delete for You". Positioned with its right edge anchored to
 * the button so it never runs off the edge of a narrow/mobile screen.
 */
function MessageKebab({ isOwn, isOpen, stage, menuRef, onToggle, onOpenChoices, onBack, onDelete }) {
    return (
        <div className="relative flex-shrink-0" ref={menuRef}>
            <button
                type="button"
                onClick={onToggle}
                aria-label="Message options"
                className={`p-1.5 rounded-full transition-colors ${
                    isOpen ? 'text-gray-700 bg-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/60 active:bg-gray-200'
                }`}
            >
                <EllipsisVerticalIcon className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute z-20 top-full mt-1 right-0 w-44 sm:w-48 max-w-[85vw] bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                    {stage === 'root' ? (
                        <button
                            type="button"
                            onClick={onOpenChoices}
                            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                        >
                            <span className="flex items-center gap-2">
                                <TrashIcon className="w-4 h-4 text-gray-400" />
                                Delete
                            </span>
                            <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onBack}
                                className="w-full flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-400 hover:bg-gray-50 border-b border-gray-100"
                            >
                                <ChevronLeftIcon className="w-3.5 h-3.5" />
                                Delete message
                            </button>
                            {isOwn && (
                                <button
                                    type="button"
                                    onClick={() => onDelete('everyone')}
                                    className="w-full text-left px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100"
                                >
                                    Delete for Everyone
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => onDelete('me')}
                                className="w-full text-left px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                            >
                                Delete for You
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}