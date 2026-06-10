import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export default function UsersIndex({ users, filters, roles, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [role,   setRole]   = useState(filters.role   || '');
    const { post, delete: destroy } = useForm();

    const applyFilters = () => router.get(route('admin.users.index'), { search, role }, { preserveState: true });
    const toggleActive = (user) => router.post(route('admin.users.toggle', user.id));
    const deleteUser   = (user) => { if (confirm(`Delete ${user.name}?`)) router.delete(route('admin.users.destroy', user.id)); };

    const statusBadge = (active) => (
        <span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>{active ? 'Active' : 'Inactive'}</span>
    );

    const roleBadge = (name) => {
        const map = { student:'badge-blue', faculty_staff:'badge-purple', admin:'badge-yellow', super_admin:'badge-red' };
        return <span className={`badge ${map[name] || 'badge-gray'}`}>{name?.replace('_', ' ')}</span>;
    };

    return (
        <AdminLayout title="User Management">
            <Head title="Users" />

            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Users</h2>
                    <p className="page-subtitle">Manage all system accounts</p>
                </div>
                <div className="flex gap-2">
                    <Link href={route('admin.users.import')} method="get" className="btn-secondary btn-sm">
                        <ArrowUpTrayIcon className="w-4 h-4 mr-1" /> Bulk Import
                    </Link>
                    <Link href={route('admin.users.create')} className="btn-primary btn-sm">
                        <PlusIcon className="w-4 h-4 mr-1" /> Add User
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="card-body py-4">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-48">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                className="input pl-9" placeholder="Search name or email…" />
                        </div>
                        <select value={role} onChange={e => setRole(e.target.value)} className="input w-44">
                            <option value="">All roles</option>
                            {roles.map(r => <option key={r.id} value={r.name}>{r.display_name}</option>)}
                        </select>
                        <button onClick={applyFilters} className="btn-primary btn-sm">Filter</button>
                        <button onClick={() => { setSearch(''); setRole(''); router.get(route('admin.users.index')); }} className="btn-secondary btn-sm">Clear</button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead><tr>
                            <th>Name</th><th>Email</th><th>Role</th><th>Pregnant</th><th>Status</th><th>Last Login</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {users.data.map(user => (
                                <tr key={user.id}>
                                    <td className="font-medium text-gray-900">{user.name}</td>
                                    <td className="text-gray-500">{user.email}</td>
                                    <td>{roleBadge(user.role?.name)}</td>
                                    <td>
                                        {(user.student_profile?.is_pregnant || user.faculty_profile?.is_pregnant)
                                            ? <span className="badge badge-red text-xs">Pregnant</span>
                                            : <span className="text-gray-300 text-xs">—</span>}
                                    </td>
                                    <td>{statusBadge(user.is_active)}</td>
                                    <td className="text-gray-400 text-xs">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {user.role?.name !== 'super_admin' || auth.user.role === 'super_admin' ? (
                                                <>
                                                    <Link href={route('admin.users.edit', user.id)} className="text-gray-400 hover:text-clinic-600 transition-colors">
                                                        <PencilIcon className="w-4 h-4" />
                                                    </Link>
                                                    {user.id !== auth.user.id && (
                                                        <button onClick={() => toggleActive(user)} className={`text-xs px-2 py-1 rounded ${user.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteUser(user)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-300 italic">—</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!users.data.length && (
                                <tr><td colSpan={7} className="text-center text-gray-400 py-8">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <span>Showing {users.from}–{users.to} of {users.total}</span>
                    <div className="flex gap-1">
                        {users.links.map((link, i) => (
                            <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)}
                                className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-clinic-600 text-white' : 'hover:bg-gray-100 text-gray-600'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
