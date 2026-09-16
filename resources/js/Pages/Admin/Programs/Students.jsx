import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserAvatar from '@/Components/Common/UserAvatar';
import PhotoLightbox from '@/Components/Common/PhotoLightbox';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ProgramStudents({ program }) {
    const [query, setQuery]         = useState('');
    const [viewingPhoto, setViewingPhoto] = useState(null);

    const students = program.student_profiles || [];

    const filtered = (() => {
        const sorted = [...students].sort((a, b) =>
            (a.user?.name || '').localeCompare(b.user?.name || '')
        );
        if (!query) return sorted;
        const q = query.toLowerCase();
        return sorted.filter(sp =>
            sp.user?.name?.toLowerCase().includes(q) ||
            sp.user?.email?.toLowerCase().includes(q) ||
            sp.student_id?.toLowerCase().includes(q) ||
            sp.block?.toLowerCase().includes(q)
        );
    })();

    return (
        <AdminLayout title="Program Students">
            <Head title={`${program.code} — Students`} />

            <div className="mb-4">
                <Link href={route('admin.programs.index')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="w-4 h-4" /> Back to Programs
                </Link>
            </div>

            {/* Search + table */}
            <div className="card">
                <div className="card-body">
                    {students.length ? (
                        <>
                            <div className="relative mb-3">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <label className="sr-only" htmlFor="program-students-search">Search students</label>
                                <input
                                    id="program-students-search"
                                    name="program-students-search"
                                    autoComplete="off"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    className={`input pl-9 ${query ? 'pr-20 sm:pr-24' : 'pr-3'} w-full sm:max-w-sm text-sm`}
                                    placeholder="Search students…"
                                />
                                {query && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 whitespace-nowrap">
                                        {filtered.length} of {students.length}
                                    </span>
                                )}
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Name</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Email</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Student ID</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Program</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Year</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Block</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Status</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Pregnant</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Last Login</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {filtered.length ? filtered.map(sp => (
                                            <tr key={sp.id} className="hover:bg-clinic-50 cursor-pointer transition-colors"
                                                onClick={() => router.visit(route('admin.programs.students.show', sp.id))}>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <UserAvatar user={sp.user} size="xs" onClick={() => setViewingPhoto(sp.user)} />
                                                        <span className="font-medium text-gray-900">{sp.user?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{sp.user?.email}</td>
                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{sp.student_id || '—'}</td>
                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{program.code}</td>
                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{sp.year_level ? `Year ${sp.year_level}` : '—'}</td>
                                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{sp.block || '—'}</td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <span className={`badge ${sp.user?.is_active ? 'badge-green' : 'badge-red'}`}>
                                                        {sp.user?.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    {sp.is_pregnant
                                                        ? <span className="badge badge-red text-xs">Yes</span>
                                                        : <span className="text-gray-400 text-xs">No</span>}
                                                </td>
                                                <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                                                    {sp.user?.last_login_at ? new Date(sp.user.last_login_at).toLocaleDateString() : 'Never'}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400 text-sm">No students match "{query}".</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 py-8 text-center">No students enrolled in this program yet.</p>
                    )}
                </div>
            </div>

            <PhotoLightbox
                photoUrl={viewingPhoto?.profile_photo_url}
                name={viewingPhoto?.name}
                onClose={() => setViewingPhoto(null)}
            />
        </AdminLayout>
    );
}
