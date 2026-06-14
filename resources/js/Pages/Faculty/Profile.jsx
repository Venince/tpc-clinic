import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import ProfilePhotoUploader from '@/Components/Common/ProfilePhotoUploader';

export default function FacultyProfile({ profile, programs }) {
    const currentDept = profile.faculty_profile?.department ?? '';
    const isOther = currentDept && !programs.some(p => p.name === currentDept);

    const [useOther, setUseOther] = useState(isOther);

    const { data, setData, put, processing, errors } = useForm({
        name:       profile.name ?? '',
        department: currentDept,
        position:   profile.faculty_profile?.position ?? '',
        phone:      profile.faculty_profile?.contact_number ?? '',
    });

    const handleDepartmentChange = (e) => {
        const val = e.target.value;
        if (val === '__other__') {
            setUseOther(true);
            setData('department', '');
        } else {
            setUseOther(false);
            setData('department', val);
        }
    };

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

                {/* Photo card */}
                <div className="card mb-6">
                    <div className="card-body flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <ProfilePhotoUploader
                            photoUrl={profile.profile_photo_url}
                            uploadRoute={route('faculty.profile.photo.update')}
                            deleteRoute={route('faculty.profile.photo.delete')}
                        />
                        <div className="text-sm text-center sm:text-left">
                            <p className="font-medium text-gray-900">{profile.name}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{profile.email}</p>
                        </div>
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

                            {/* Department / Program */}
                            <div>
                                <label className="label">Department / Program</label>
                                <select
                                    value={useOther ? '__other__' : data.department}
                                    onChange={handleDepartmentChange}
                                    className="input"
                                >
                                    <option value="">— Select a program —</option>
                                    {programs.map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                    <option value="__other__">Other</option>
                                </select>

                                {useOther && (
                                    <input
                                        value={data.department}
                                        onChange={e => setData('department', e.target.value)}
                                        className="input mt-2"
                                        placeholder="Enter your department or office"
                                        autoFocus
                                    />
                                )}
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