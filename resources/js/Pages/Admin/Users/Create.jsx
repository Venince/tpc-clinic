import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CreateUser({ roles }) {
    const { data, setData, post, processing, errors } = useForm({ name: '', email: '', role: 'student' });

    const submit = (e) => { e.preventDefault(); post(route('admin.users.store')); };

    return (
        <AdminLayout title="Create User">
            <Head title="Create User" />
            <div className="max-w-lg">
                <Link href={route('admin.users.index')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                    <ArrowLeftIcon className="w-4 h-4" /> Back to Users
                </Link>

                <div className="card">
                    <div className="card-header">
                        <h2 className="font-semibold text-gray-900">New User Account</h2>
                        <p className="text-sm text-gray-500 mt-1">A temporary password will be emailed automatically.</p>
                    </div>
                    <div className="card-body">
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="label">Full Name</label>
                                <input value={data.name} onChange={e => setData('name', e.target.value)}
                                    className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Venince Dave Quiamco Autida" />
                                {errors.name && <p className="error-msg">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="label">Email Address</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    className={`input ${errors.email ? 'input-error' : ''}`} placeholder="venincedave@gmail.com" />
                                {errors.email && <p className="error-msg">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="label">Role</label>
                                <select value={data.role} onChange={e => setData('role', e.target.value)} className="input">
                                    {roles.map(r => <option key={r.id} value={r.name}>{r.display_name}</option>)}
                                </select>
                                {errors.role && <p className="error-msg">{errors.role}</p>}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={processing} className="btn-primary">
                                    {processing ? 'Creating…' : 'Create User'}
                                </button>
                                <Link href={route('admin.users.index')} className="btn-secondary">Cancel</Link>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Bulk Import Card */}
                <div className="card mt-4 border-dashed border-2 border-gray-200 bg-gray-50">
                    <div className="card-body text-center py-8">
                        <p className="text-sm font-medium text-gray-700 mb-1">Bulk Import via TXT file</p>
                        <p className="text-xs text-gray-400 mb-4">Upload a .txt file with one email per line</p>
                        <form method="POST" action={route('admin.users.import')} encType="multipart/form-data" className="flex flex-col items-center gap-3">
                            <input type="hidden" name="_token" value={document.querySelector('meta[name=csrf-token]')?.content} />
                            <select name="role" className="input w-48 text-sm">
                                <option value="student">Student</option>
                                <option value="faculty_staff">Faculty/Staff</option>
                            </select>
                            <input type="file" name="file" accept=".txt" className="text-sm text-gray-500" />
                            <button type="submit" className="btn-secondary btn-sm">Import</button>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
