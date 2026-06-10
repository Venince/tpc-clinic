import { Head, Link } from '@inertiajs/react';
import { MegaphoneIcon } from '@heroicons/react/24/outline';

export default function PublicAnnouncements({ announcements }) {
    const catColor = (c) => ({ general:'bg-blue-100 text-blue-700', health:'bg-green-100 text-green-700', event:'bg-purple-100 text-purple-700' })[c] || 'bg-gray-100 text-gray-700';

    return (
        <>
            <Head title="Announcements — TPC Clinic"/>
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                    <Link href={route('home')} className="flex items-center gap-3">
                        <img src="/images/tpc-logo.png" alt="TPC" className="w-9 h-9 object-contain" />
                        <span className="font-semibold text-gray-900">TPC Clinic</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href={route('home')} className="text-sm text-gray-500 hover:text-clinic-600 transition-colors">← Home</Link>
                        <Link href={route('login')} className="btn-primary btn-sm">Login</Link>
                    </div>
                </nav>
                <div className="max-w-3xl mx-auto px-6 py-10">
                    <div className="flex items-center gap-3 mb-8">
                        <MegaphoneIcon className="w-7 h-7 text-clinic-600"/>
                        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                    </div>
                    <div className="space-y-4">
                        {announcements.data.map(a => (
                            <div key={a.id} className="card p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${catColor(a.category)}`}>{a.category}</span>
                                        </div>
                                        <h2 className="font-semibold text-gray-900 text-lg">{a.title}</h2>
                                        <p className="text-gray-600 mt-2 text-sm leading-relaxed">{a.content}</p>
                                        <p className="text-xs text-gray-400 mt-3">{new Date(a.published_at).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!announcements.data.length && (
                            <div className="card p-10 text-center text-gray-400">No announcements at this time.</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
