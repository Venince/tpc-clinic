import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Faculty({ faculty }) {   // ← prop from Inertia
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
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="relative max-w-sm">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input pl-9 w-full text-sm"
                            placeholder="Search by name, email, ID, department…"
                        />
                        {search && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
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
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Position</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pregnant</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Login</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filtered.map(fp => (
                                    <tr key={fp.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium text-gray-900">{fp.user?.name}</td>
                                        <td className="px-4 py-2 text-gray-500">{fp.user?.email}</td>
                                        <td className="px-4 py-2 text-gray-500">{fp.employee_id || '—'}</td>
                                        <td className="px-4 py-2 text-gray-500">{fp.department || '—'}</td>
                                        <td className="px-4 py-2 text-gray-500">{fp.position || '—'}</td>
                                        <td className="px-4 py-2">
                                            <span className={`badge ${fp.user?.is_active ? 'badge-green' : 'badge-red'}`}>
                                                {fp.user?.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {fp.is_pregnant
                                                ? <span className="badge badge-red text-xs">Yes</span>
                                                : <span className="text-gray-400 text-xs">No</span>}
                                        </td>
                                        <td className="px-4 py-2 text-gray-400 text-xs">
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