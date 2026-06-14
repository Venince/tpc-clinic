import { Head, Link, router } from '@inertiajs/react';
import { MegaphoneIcon } from '@heroicons/react/24/outline';

export default function PublicAnnouncements({ announcements }) {
    const catColor = (c) => ({
        general: 'bg-green-50 text-green-700',
        health:  'bg-blue-50 text-blue-700',
        event:   'bg-purple-50 text-purple-700',
    })[c] || 'bg-gray-100 text-gray-600';

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
                            className="text-sm text-gray-500 hover:text-clinic-600 transition-colors">
                            ← Home
                        </Link>
                        <Link href={route('login')}
                            className="bg-clinic-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-clinic-700 transition-colors">
                            Sign in
                        </Link>
                    </div>
                </nav>

                {/* ── Content ── */}
                <div className="page-fade">
                    <div className="max-w-3xl mx-auto px-6 py-10">
                        <div className="flex items-center gap-3 mb-8">
                            <MegaphoneIcon className="w-7 h-7 text-clinic-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                        </div>
                        <div className="space-y-4">
                            {announcements.data.map(a => (
                                <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-shrink-0 w-12 text-center bg-green-50 rounded-xl py-2 px-1">
                                            <p className="text-lg font-bold text-clinic-700 leading-none">{new Date(a.published_at).getDate()}</p>
                                            <p className="text-xs text-clinic-500 uppercase mt-0.5">{new Date(a.published_at).toLocaleString('default', { month: 'short' })}</p>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 ${catColor(a.category)}`}>
                                                {a.category}
                                            </span>
                                            <h2 className="font-semibold text-gray-900 text-lg mb-1">{a.title}</h2>
                                            <p className="text-gray-500 text-sm leading-relaxed">{a.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!announcements.data.length && (
                                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
                                    No announcements at this time.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}