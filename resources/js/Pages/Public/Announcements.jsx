import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { MegaphoneIcon, HomeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

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

function PinIcon({ className = 'w-4 h-4' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
            <path d="M12 17v5" />
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
        </svg>
    );
}

const PREVIEW_LINES = 8;
const PREVIEW_CHARS = 600;

// Long posts (e.g. lists of names/emails) collapse to a preview with Read more / Show less.
function ExpandableText({ text = '', className = '' }) {
    const [expanded, setExpanded] = useState(false);
    const lines = text.split('\n');
    const isLong = lines.length > PREVIEW_LINES || text.length > PREVIEW_CHARS;

    let preview = lines.slice(0, PREVIEW_LINES).join('\n');
    if (preview.length > PREVIEW_CHARS) {
        const cut = preview.slice(0, PREVIEW_CHARS);
        const lastBreak = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf('\n'));
        preview = lastBreak > 0 ? cut.slice(0, lastBreak) : cut;
    }

    return (
        <>
            <p className={`${className} whitespace-pre-line break-words`}>
                {isLong && !expanded ? preview.trimEnd() + '…' : text}
            </p>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded(e => !e)}
                    className="mt-2 text-sm font-medium text-clinic-600 hover:text-clinic-700"
                >
                    {expanded ? 'Show less' : 'Read more'}
                </button>
            )}
        </>
    );
}

export default function PublicAnnouncements({ announcements }) {
    const goToSection = (hash) => {
        router.visit(route('home'), {
            onSuccess: () => {
                setTimeout(() => {
                    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        });
    };

    return (
        <>
            <Head title="Announcements — TPC e-Clinic" />
            <div className="min-h-screen bg-white font-sans">

                {/* ── Nav ── */}
                <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 md:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-8">
                        <Link href={route('home')} className="flex items-center gap-2.5">
                            <img src="/images/tpc-logo.png" alt="TPC" className="w-8 h-8 object-contain" />
                            <span className="font-semibold text-gray-900 text-sm">TPC e-Clinic</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-6">
                            <Link href={route('home')}
                                className="text-sm text-gray-500 hover:text-clinic-600 transition-colors">
                                Home
                            </Link>
                            <a href="#" onClick={e => { e.preventDefault(); goToSection('#services'); }}
                                className="text-sm text-gray-500 hover:text-clinic-600 transition-colors">
                                Services
                            </a>
                            <a href="#" onClick={e => { e.preventDefault(); goToSection('#about'); }}
                                className="text-sm text-gray-500 hover:text-clinic-600 transition-colors">
                                About
                            </a>
                            <Link href={route('announcements')}
                                className="text-sm text-gray-500 hover:text-clinic-600 transition-colors">
                                Announcements
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('home')}
                            className="p-2 text-gray-500 hover:text-clinic-600 transition-colors"
                            title="Home">
                            <HomeIcon className="w-5 h-5" />
                        </Link>
                        <Link href={route('announcements')}
                            className="md:hidden p-2 text-clinic-600"
                            title="Announcements">
                            <MegaphoneIcon className="w-5 h-5" />
                        </Link>
                        <Link href={route('login')}
                            className="bg-clinic-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-clinic-700 transition-colors">
                            Sign in
                        </Link>
                    </div>
                </nav>

                {/* ── Content ── */}
                <div className="page-fade">
                    <div className="max-w-2xl mx-auto px-6 py-10">
                        <div className="flex items-center gap-3 mb-8">
                            <MegaphoneIcon className="w-7 h-7 text-clinic-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                        </div>
                        <div className="space-y-4">
                            {announcements.data.map(a => {
                                return (
                                    <div key={a.id} className={`bg-white rounded-xl border overflow-hidden transition-colors ${a.is_pinned ? 'border-green-200 hover:border-green-300' : 'border-gray-200 hover:border-gray-300'}`}>
                                        {/* Post header */}
                                        <div className="flex items-center gap-3 px-5 sm:px-6 pt-4 pb-2">
                                            <img src="/images/tpc-logo.png" alt="TPC e-Clinic" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm leading-tight truncate">TPC e-Clinic</p>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <span>{timeAgo(a.published_at)}</span>
                                                    <span>·</span>
                                                    <GlobeAltIcon className="w-3 h-3" title="Public announcement" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Post body */}
                                        <div className="px-5 sm:px-6 pb-4">
                                            {a.is_pinned && (
                                                <p className="flex items-center gap-1 text-xs font-medium text-green-600 mb-1">
                                                    <PinIcon className="w-3.5 h-3.5" /> Pinned
                                                </p>
                                            )}
                                            <h2 className="font-semibold text-gray-900 text-base sm:text-lg leading-snug mb-1">{a.title}</h2>
                                            <ExpandableText text={a.content} className="text-gray-600 text-sm leading-relaxed" />
                                        </div>
                                    </div>
                                );
                            })}
                            {!announcements.data.length && (
                                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
                                    No announcements at this time.
                                </div>
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
                </div>
            </div>
        </>
    );
}
