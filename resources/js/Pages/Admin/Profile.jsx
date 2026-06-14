import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProfilePhotoUploader from '@/Components/Common/ProfilePhotoUploader';

export default function AdminProfile({ profile }) {
    const isSuperAdmin = profile.role?.name === 'super_admin';

    const nameForm = useForm({
        name:  profile.name  ?? '',
        email: profile.email ?? '',
    });

    const passwordForm = useForm({
        current_password:      '',
        password:              '',
        password_confirmation: '',
    });

    const submitName = (e) => {
        e.preventDefault();
        nameForm.put(route('admin.profile.update'));
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.put(route('admin.profile.password'), {
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AdminLayout title="My Profile">
            <Head title="Profile" />

            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">

                {/* ── Page header ── */}
                <div className="page-header">
                    <div>
                        <h2 className="page-title">My Profile</h2>
                        <p className="page-subtitle">Manage your account information</p>
                    </div>
                </div>

                {/* ── Avatar / identity banner ── */}
                <div className="card p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        {/* Photo uploader — mirrors student/faculty behaviour */}
                        <ProfilePhotoUploader
                            photoUrl={profile.profile_photo_url}
                            uploadRoute={route('admin.profile.photo.update')}
                            deleteRoute={route('admin.profile.photo.delete')}
                        />

                        {/* Identity info */}
                        <div className="text-center sm:text-left min-w-0">
                            <p className="font-semibold text-gray-900 text-lg truncate">{profile.name}</p>
                            <p className="text-sm text-gray-500 truncate">{profile.email}</p>
                            {profile.role?.display_name && (
                                <span className="inline-block mt-1.5 text-xs font-medium bg-clinic-50 text-clinic-700 px-2 py-0.5 rounded-full">
                                    {profile.role.display_name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Account Information ── */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900">Account Information</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {isSuperAdmin ? 'Update your display name and email' : 'Update your display name'}
                        </p>
                    </div>
                    <div className="card-body">
                        <form onSubmit={submitName} className="space-y-4">
                            <div>
                                <label className="label">Full Name</label>
                                <input
                                    value={nameForm.data.name}
                                    onChange={e => nameForm.setData('name', e.target.value)}
                                    className={`input ${nameForm.errors.name ? 'input-error' : ''}`}
                                    placeholder="Juan Dela Cruz"
                                />
                                {nameForm.errors.name && (
                                    <p className="error-msg">{nameForm.errors.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="label">Email</label>
                                {isSuperAdmin ? (
                                    <>
                                        <input
                                            type="email"
                                            value={nameForm.data.email}
                                            onChange={e => nameForm.setData('email', e.target.value)}
                                            className={`input ${nameForm.errors.email ? 'input-error' : ''}`}
                                            placeholder="you@tpc.edu.ph"
                                        />
                                        {nameForm.errors.email && (
                                            <p className="error-msg">{nameForm.errors.email}</p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <input
                                            value={profile.email}
                                            disabled
                                            className="input opacity-60 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                                    </>
                                )}
                            </div>
                            <div>
                                <label className="label">Role</label>
                                <input
                                    value={profile.role?.display_name ?? ''}
                                    disabled
                                    className="input opacity-60 cursor-not-allowed"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={nameForm.processing}
                                    className="btn-primary w-full sm:w-auto"
                                >
                                    {nameForm.processing ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ── Change Password ── */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900">Change Password</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Use a strong password of at least 8 characters</p>
                    </div>
                    <div className="card-body">
                        <form onSubmit={submitPassword} className="space-y-4">
                            <div>
                                <label className="label">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={e => passwordForm.setData('current_password', e.target.value)}
                                    className={`input ${passwordForm.errors.current_password ? 'input-error' : ''}`}
                                    autoComplete="current-password"
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="error-msg">{passwordForm.errors.current_password}</p>
                                )}
                            </div>
                            <div>
                                <label className="label">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={e => passwordForm.setData('password', e.target.value)}
                                    className={`input ${passwordForm.errors.password ? 'input-error' : ''}`}
                                    autoComplete="new-password"
                                />
                                {passwordForm.errors.password && (
                                    <p className="error-msg">{passwordForm.errors.password}</p>
                                )}
                            </div>
                            <div>
                                <label className="label">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                    className={`input ${passwordForm.errors.password_confirmation ? 'input-error' : ''}`}
                                    autoComplete="new-password"
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="error-msg">{passwordForm.errors.password_confirmation}</p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="btn-primary w-full sm:w-auto"
                                >
                                    {passwordForm.processing ? 'Updating…' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
