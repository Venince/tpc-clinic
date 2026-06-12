import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';

export default function Faculty({ faculty }) {
    const [search, setSearch] = useState('');

    const filtered = faculty.filter(fp => {
        const q = search.toLowerCase();
        return (
            fp.user?.name?.toLowerCase().includes(q) ||
            fp.user?.email?.toLowerCase().includes(q) ||
            fp.employee_id?.toLowerCase().includes(q) ||
            fp.department?.toLowerCase().includes(q) ||
            fp.position?.toLowerCase().includes(q)
        );
    });

    return (
        <AdminLayout title="Faculty & Staff">
            <Head title="Faculty & Staff" />

            <div className="page-header">
                <div>
                    <h2 className="page-title">Faculty &amp; Staff</h2>
                    <p className="page-subtitle">View all faculty and staff records</p>
                </div>
            </div>

            <div className="card">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                    <div className="relative w-full sm:max-w-sm">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input pl-9 pr-20 sm:pr-24 w-full text-sm"
                            placeholder="Search by name, email, ID, department…"
                        />
                        {search && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 whitespace-nowrap">
                                {filtered.length} of {faculty.length}
                            </span>
                        )}
                    </div>
                </div>

                {filtered.length ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Employee ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Department</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Position</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Pregnant</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Last Login</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filtered.map(fp => (
                                    <tr key={fp.id} className="hover:bg-clinic-50 cursor-pointer transition-colors"
                                        onClick={() => router.visit(route('admin.faculty.show', fp.id))}>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <UserAvatar user={fp.user} size="sm" />
                                                <span className="font-medium text-gray-900">{fp.user?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{fp.user?.email}</td>
                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{fp.employee_id || '—'}</td>
                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{fp.department || '—'}</td>
                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{fp.position || '—'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {fp.is_pregnant
                                                ? <span className="badge badge-red text-xs">Yes</span>
                                                : <span className="text-gray-400 text-xs">No</span>}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <span className={`badge ${fp.user?.is_active ? 'badge-green' : 'badge-red'}`}>
                                                {fp.user?.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                                            {fp.user?.last_login_at
                                                ? new Date(fp.user.last_login_at).toLocaleDateString()
                                                : 'Never'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center text-gray-400">
                        {search ? `No faculty match "${search}".` : 'No faculty records found.'}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}