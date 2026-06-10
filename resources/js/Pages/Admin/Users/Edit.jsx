import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditUser({ user }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name, email: user.email, is_active: user.is_active,
    });

    const submit = (e) => { e.preventDefault(); put(route('admin.users.update', user.id)); };

    return (
        <AdminLayout title="Edit User">
            <Head title="Edit User" />
            <div className="max-w-lg">
                <Link href={route('admin.users.index')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                    <ArrowLeftIcon className="w-4 h-4" /> Back to Users
                </Link>

                <div className="card">
                    <div className="card-header">
                        <h2 className="font-semibold text-gray-900">Edit: {user.name}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Role: {user.role?.display_name}</p>
                    </div>
                    <div className="card-body">
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="label">Full Name</label>
                                <input value={data.name} onChange={e => setData('name', e.target.value)}
                                    className={`input ${errors.name ? 'input-error' : ''}`} />
                                {errors.name && <p className="error-msg">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="label">Email Address</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    className={`input ${errors.email ? 'input-error' : ''}`} />
                                {errors.email && <p className="error-msg">{errors.email}</p>}
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="is_active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-clinic-600 focus:ring-clinic-500" />
                                <label htmlFor="is_active" className="text-sm text-gray-700">Account is active</label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={processing} className="btn-primary">
                                    {processing ? 'Saving…' : 'Save Changes'}
                                </button>
                                <Link href={route('admin.users.index')} className="btn-secondary">Cancel</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
