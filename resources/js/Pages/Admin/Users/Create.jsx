import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CreateUser({ roles, programs }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '', email: '', role: 'student',
        personal_type: '', program_id: '', year_level: '',
    });

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
                                <label className="label" htmlFor="create-user-name">Full Name</label>
                                <input id="create-user-name" name="name" autoComplete="name" value={data.name} onChange={e => setData('name', e.target.value)}
                                    className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Venince Dave Quiamco Autida" />
                                {errors.name && <p className="error-msg">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="label" htmlFor="create-user-email">Email Address</label>
                                <input id="create-user-email" name="email" type="email" autoComplete="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    className={`input ${errors.email ? 'input-error' : ''}`} placeholder="venincedave@gmail.com" />
                                {errors.email && <p className="error-msg">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="label" htmlFor="create-user-role">Role</label>
                                <select id="create-user-role" name="role" value={data.role} onChange={e => setData('role', e.target.value)} className="input">
                                    {roles.map(r => <option key={r.id} value={r.name}>{r.display_name}</option>)}
                                </select>
                                {errors.role && <p className="error-msg">{errors.role}</p>}
                            </div>

                            {data.role === 'admin' && (
                                <div className="rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50">
                                    <div>
                                        <label className="label" htmlFor="create-user-personal-type">
                                            Personal Account <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <select
                                            id="create-user-personal-type"
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
                                        </p>
                                        {errors.personal_type && <p className="error-msg">{errors.personal_type}</p>}
                                    </div>

                                    {data.personal_type === 'student' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="label" htmlFor="create-user-program">Program <span className="text-gray-400 font-normal">(optional)</span></label>
                                                <select id="create-user-program" name="program_id" value={data.program_id} onChange={e => setData('program_id', e.target.value)} className="input">
                                                    <option value="">Not set</option>
                                                    {programs.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                                                </select>
                                                {errors.program_id && <p className="error-msg">{errors.program_id}</p>}
                                            </div>
                                            <div>
                                                <label className="label" htmlFor="create-user-year-level">Year Level <span className="text-gray-400 font-normal">(optional)</span></label>
                                                <select id="create-user-year-level" name="year_level" value={data.year_level} onChange={e => setData('year_level', e.target.value)} className="input">
                                                    <option value="">Not set</option>
                                                    {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                                                </select>
                                                {errors.year_level && <p className="error-msg">{errors.year_level}</p>}
                                            </div>
                                            <p className="text-xs text-gray-400 col-span-2 -mt-1">
                                                Can be left unset — the admin can complete this themselves after logging in.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
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
                        <Link href={route('admin.users.import')} className="btn-secondary btn-sm">
                            Go to Bulk Import
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
