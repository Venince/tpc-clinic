import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftIcon, KeyIcon } from '@heroicons/react/24/outline';

export default function EditUser({ user }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name, email: user.email, is_active: user.is_active,
    });

    const submit = (e) => { e.preventDefault(); put(route('admin.users.update', user.id)); };

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const {
        data: pwData, setData: setPwData, put: putPassword,
        processing: pwProcessing, errors: pwErrors, reset: resetPw,
    } = useForm({ password: '', password_confirmation: '' });

    const submitPassword = (e) => {
        e.preventDefault();
        putPassword(route('admin.users.password', user.id), {
            preserveScroll: true,
            onSuccess: () => { resetPw(); setShowPasswordForm(false); },
        });
    };

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

                <div className="card mt-6">
                    <div className="card-header flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <KeyIcon className="w-4 h-4 text-gray-400" /> Password
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">Set a new password for this account.</p>
                        </div>
                        {!showPasswordForm && (
                            <button type="button" onClick={() => setShowPasswordForm(true)} className="btn-secondary btn-sm">
                                Change Password
                            </button>
                        )}
                    </div>
                    {showPasswordForm && (
                        <div className="card-body">
                            <form onSubmit={submitPassword} className="space-y-4">
                                <div>
                                    <label className="label">New Password</label>
                                    <input type="password" value={pwData.password} onChange={e => setPwData('password', e.target.value)}
                                        className={`input ${pwErrors.password ? 'input-error' : ''}`} autoComplete="new-password" />
                                    {pwErrors.password && <p className="error-msg">{pwErrors.password}</p>}
                                </div>
                                <div>
                                    <label className="label">Confirm New Password</label>
                                    <input type="password" value={pwData.password_confirmation} onChange={e => setPwData('password_confirmation', e.target.value)}
                                        className="input" autoComplete="new-password" />
                                </div>
                                <p className="text-xs text-gray-400">
                                    {user.name} will be notified and required to set a new password on their next login.
                                </p>
                                <div className="flex gap-3 pt-1">
                                    <button type="submit" disabled={pwProcessing} className="btn-primary">
                                        {pwProcessing ? 'Updating…' : 'Update Password'}
                                    </button>
                                    <button type="button" onClick={() => { setShowPasswordForm(false); resetPw(); }} className="btn-secondary">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
