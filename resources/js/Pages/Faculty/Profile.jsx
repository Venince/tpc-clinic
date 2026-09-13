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
            <div className="max-w-5xl mx-auto">
                <div className="page-header">
                    <div>
                        <p className="page-subtitle">Update your personal information</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">

                    {/* Photo card — sticky on the left on desktop */}
                    <div className="card lg:sticky lg:top-6">
                        <div className="card-body flex flex-col items-center text-center gap-4">
                            <ProfilePhotoUploader
                                photoUrl={profile.profile_photo_url}
                                uploadRoute={route('faculty.profile.photo.update')}
                                deleteRoute={route('faculty.profile.photo.delete')}
                            />
                            <div className="text-sm min-w-0">
                                <p className="font-medium text-gray-900 truncate">{profile.name}</p>
                                <p className="text-gray-400 text-xs mt-0.5 truncate">{profile.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 card">
                        <div className="card-body">
                            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="label" htmlFor="faculty-profile-name">Full Name</label>
                                    <input id="faculty-profile-name" name="name" autoComplete="name" value={data.name} onChange={e => setData('name', e.target.value)} className="input" />
                                    {errors.name && <p className="error-msg">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="label" htmlFor="faculty-profile-email">Email</label>
                                    <input id="faculty-profile-email" name="email" autoComplete="email" value={profile.email} disabled className="input opacity-60 cursor-not-allowed" />
                                </div>

                                {/* Department / Program */}
                                <div>
                                    <label className="label" htmlFor="faculty-profile-department">Department / Program</label>
                                    <select
                                        id="faculty-profile-department"
                                        name="department"
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
                                            id="faculty-profile-department-other"
                                            name="department_other"
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
                                    <label className="label" htmlFor="faculty-profile-position">Position</label>
                                    <input id="faculty-profile-position" name="position" value={data.position} onChange={e => setData('position', e.target.value)} className="input" placeholder="e.g. Instructor" />
                                    {errors.position && <p className="error-msg">{errors.position}</p>}
                                </div>
                                <div>
                                    <label className="label" htmlFor="faculty-profile-phone">Phone</label>
                                    <input id="faculty-profile-phone" name="phone" autoComplete="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} className="input" placeholder="e.g. 09XX XXX XXXX" />
                                    {errors.phone && <p className="error-msg">{errors.phone}</p>}
                                </div>
                                <div className="sm:col-span-2 flex justify-end">
                                    <button type="submit" disabled={processing} className="btn-primary w-full sm:w-auto">
                                        {processing ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </FacultyLayout>
    );
}
