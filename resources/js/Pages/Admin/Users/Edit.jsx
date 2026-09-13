import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftIcon, KeyIcon } from '@heroicons/react/24/outline';

export default function EditUser({ user, programs }) {
    const currentPersonalType = user.student_profile ? 'student' : (user.faculty_profile ? 'faculty_staff' : '');

    const { data, setData, put, processing, errors } = useForm({
        name: user.name, email: user.email, is_active: user.is_active,
        personal_type: currentPersonalType,
        program_id: user.student_profile?.program_id ?? '',
        year_level: user.student_profile?.year_level ?? '',
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
                                <label className="label" htmlFor="edit-user-name">Full Name</label>
                                <input id="edit-user-name" name="name" autoComplete="name" value={data.name} onChange={e => setData('name', e.target.value)}
                                    className={`input ${errors.name ? 'input-error' : ''}`} />
                                {errors.name && <p className="error-msg">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="label" htmlFor="edit-user-email">Email Address</label>
                                <input id="edit-user-email" name="email" type="email" autoComplete="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    className={`input ${errors.email ? 'input-error' : ''}`} />
                                {errors.email && <p className="error-msg">{errors.email}</p>}
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="is_active" name="is_active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-clinic-600 focus:ring-clinic-500" />
                                <label htmlFor="is_active" className="text-sm text-gray-700">Account is active</label>
                            </div>

                            {user.role?.name === 'admin' && (
                                <div className="rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50">
                                    <div>
                                        <label className="label" htmlFor="edit-user-personal-type">
                                            Personal Account <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <select
                                            id="edit-user-personal-type"
                                            name="personal_type"
                                            value={data.personal_type}
                                            onChange={e => setData('personal_type', e.target.value)}
                                            className="input"
                                        >
                                            <option value="">None</option>
                                            <option value="student">Student</option>
                                            <option value="faculty_staff">Faculty / Staff</option>
                                        </select>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Lets this admin switch to a Student or Faculty/Staff view of their own account —
                                            to book appointments, request medicine, answer surveys, and submit requirements.
                                            {currentPersonalType && data.personal_type !== currentPersonalType && (
                                                <span className="text-amber-600 font-medium">
                                                    {' '}Changing this will {data.personal_type ? 're-create' : 'delete'} their {currentPersonalType === 'student' ? 'student' : 'faculty/staff'} profile data.
                                                </span>
                                            )}
                                        </p>
                                        {errors.personal_type && <p className="error-msg">{errors.personal_type}</p>}
                                    </div>

                                    {data.personal_type === 'student' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="label" htmlFor="edit-user-program">Program <span className="text-gray-400 font-normal">(optional)</span></label>
                                                <select id="edit-user-program" name="program_id" value={data.program_id} onChange={e => setData('program_id', e.target.value)} className="input">
                                                    <option value="">Not set</option>
                                                    {programs.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                                                </select>
                                                {errors.program_id && <p className="error-msg">{errors.program_id}</p>}
                                            </div>
                                            <div>
                                                <label className="label" htmlFor="edit-user-year-level">Year Level <span className="text-gray-400 font-normal">(optional)</span></label>
                                                <select id="edit-user-year-level" name="year_level" value={data.year_level} onChange={e => setData('year_level', e.target.value)} className="input">
                                                    <option value="">Not set</option>
                                                    {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                                                </select>
                                                {errors.year_level && <p className="error-msg">{errors.year_level}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                    <label className="label" htmlFor="edit-user-new-password">New Password</label>
                                    <input id="edit-user-new-password" name="password" type="password" value={pwData.password} onChange={e => setPwData('password', e.target.value)}
                                        className={`input ${pwErrors.password ? 'input-error' : ''}`} autoComplete="new-password" />
                                    {pwErrors.password && <p className="error-msg">{pwErrors.password}</p>}
                                </div>
                                <div>
                                    <label className="label" htmlFor="edit-user-confirm-password">Confirm New Password</label>
                                    <input id="edit-user-confirm-password" name="password_confirmation" type="password" value={pwData.password_confirmation} onChange={e => setPwData('password_confirmation', e.target.value)}
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
