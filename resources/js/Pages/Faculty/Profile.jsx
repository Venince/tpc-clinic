import { Head, useForm } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';

export default function FacultyProfile({ profile, programs }) {
    const { data, setData, put, processing, errors } = useForm({
        name:       profile.name ?? '',
        department: profile.faculty_profile?.department ?? '',
        position:   profile.faculty_profile?.position ?? '',
        phone:      profile.faculty_profile?.contact_number ?? '',
    });

    const submit = (e) => { e.preventDefault(); put(route('faculty.profile.update')); };

    return (
        <FacultyLayout title="My Profile">
            <Head title="Profile" />
            <div className="max-w-2xl mx-auto">
                <div className="page-header">
                    <div>
                        <h2 className="page-title">My Profile</h2>
                        <p className="page-subtitle">Update your personal information</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="label">Full Name</label>
                                <input value={data.name} onChange={e => setData('name', e.target.value)} className="input" />
                                {errors.name && <p className="error-msg">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input value={profile.email} disabled className="input opacity-60 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="label">Department / Program</label>
                                <select value={data.department} onChange={e => setData('department', e.target.value)} className="input">
                                    <option value="">— Select a program —</option>
                                    {programs.map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                                {errors.department && <p className="error-msg">{errors.department}</p>}
                            </div>
                            <div>
                                <label className="label">Position</label>
                                <input value={data.position} onChange={e => setData('position', e.target.value)} className="input" placeholder="e.g. Instructor" />
                                {errors.position && <p className="error-msg">{errors.position}</p>}
                            </div>
                            <div>
                                <label className="label">Phone</label>
                                <input value={data.phone} onChange={e => setData('phone', e.target.value)} className="input" placeholder="e.g. 09XX XXX XXXX" />
                                {errors.phone && <p className="error-msg">{errors.phone}</p>}
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={processing} className="btn-primary">
                                    {processing ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </FacultyLayout>
    );
}