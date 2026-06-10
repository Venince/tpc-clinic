import { Head, useForm } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';

export default function StudentProfile({ profile, programs }) {
    const student = profile.student_profile || {};

    const { data, setData, put, processing, errors } = useForm({
        name:                 profile.name             || '',
        student_id:           student.student_id       || '',
        program_id:           student.program_id       || '',
        year_level:           student.year_level       || '',
        block:                student.block            || '',
        birth_date:           student.birth_date       || '',
        sex:                  student.sex              || '',
        contact_number:       student.contact_number   || '',
        address:              student.address          || '',
        guardian_name:        student.guardian_name    || '',
        guardian_contact:     student.guardian_contact || '',
        civil_status:         student.civil_status     || 'single',
        is_pregnant:          student.is_pregnant      || false,
        pregnancy_due_date:   student.pregnancy_due_date || '',
    });

    const submit = (e) => { e.preventDefault(); put(route('student.profile.update')); };

    return (
        <StudentLayout title="My Profile">
            <Head title="Profile" />

            <div className="max-w-2xl mx-auto">
                {/* Account info (read-only) */}
                <div className="card mb-6">
                    <div className="card-header bg-clinic-50">
                        <h3 className="font-semibold text-clinic-900">Account Information</h3>
                    </div>
                    <div className="card-body grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wide">Email</p>
                            <p className="font-medium mt-0.5">{profile.email}</p>
                        </div>
                    </div>
                </div>

                {/* Editable profile */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900">My Profile</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Keep your information up to date</p>
                    </div>
                    <div className="card-body">
                        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* --- Account --- */}
                            <div className="sm:col-span-2">
                                <label className="label">Full Name</label>
                                <input
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className={`input ${errors.name ? 'input-error' : ''}`}
                                    placeholder="Juan Dela Cruz"
                                />
                                {errors.name && <p className="error-msg">{errors.name}</p>}
                            </div>

                            {/* --- Enrollment --- */}
                            <div>
                                <label className="label">Student ID</label>
                                <input
                                    value={data.student_id}
                                    onChange={e => setData('student_id', e.target.value)}
                                    className={`input ${errors.student_id ? 'input-error' : ''}`}
                                    placeholder="e.g. 2021-00123"
                                />
                                {errors.student_id && <p className="error-msg">{errors.student_id}</p>}
                            </div>
                            <div>
                                <label className="label">Program</label>
                                <select
                                    value={data.program_id}
                                    onChange={e => setData('program_id', e.target.value)}
                                    className={`input ${errors.program_id ? 'input-error' : ''}`}
                                >
                                    <option value="">— Select Program —</option>
                                    {programs.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {errors.program_id && <p className="error-msg">{errors.program_id}</p>}
                            </div>
                            <div>
                                <label className="label">Year Level</label>
                                <select
                                    value={data.year_level}
                                    onChange={e => setData('year_level', e.target.value)}
                                    className={`input ${errors.year_level ? 'input-error' : ''}`}
                                >
                                    <option value="">— Select —</option>
                                    {[1, 2, 3, 4, 5, 6].map(y => (
                                        <option key={y} value={y}>Year {y}</option>
                                    ))}
                                </select>
                                {errors.year_level && <p className="error-msg">{errors.year_level}</p>}
                            </div>
                            <div>
                                <label className="label">Block</label>
                                <input
                                    value={data.block}
                                    onChange={e => setData('block', e.target.value)}
                                    className={`input ${errors.block ? 'input-error' : ''}`}
                                    placeholder="e.g. A, B, 1"
                                />
                                {errors.block && <p className="error-msg">{errors.block}</p>}
                            </div>

                            {/* --- Health --- */}
                            <div>
                                <label className="label">Birth Date</label>
                                <input
                                    type="date"
                                    value={data.birth_date}
                                    onChange={e => setData('birth_date', e.target.value)}
                                    className={`input ${errors.birth_date ? 'input-error' : ''}`}
                                />
                                {errors.birth_date && <p className="error-msg">{errors.birth_date}</p>}
                            </div>
                            <div>
                                <label className="label">Sex</label>
                                <select
                                    value={data.sex}
                                    onChange={e => {
                                        setData('sex', e.target.value);
                                        if (e.target.value === 'male') {
                                            setData('is_pregnant', false);
                                            setData('pregnancy_due_date', '');
                                        }
                                    }}
                                    className="input"
                                >
                                    <option value="">— Select —</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Prefer not to say</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Contact Number</label>
                                <input
                                    value={data.contact_number}
                                    onChange={e => setData('contact_number', e.target.value)}
                                    className="input"
                                    placeholder="09xxxxxxxxx"
                                />
                            </div>
                            <div>
                                <label className="label">Civil Status</label>
                                <select value={data.civil_status} onChange={e => setData('civil_status', e.target.value)} className="input">
                                    {['single', 'married', 'widowed', 'separated'].map(s => (
                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="label">Address</label>
                                <textarea
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    className="input"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="label">Guardian Name</label>
                                <input value={data.guardian_name} onChange={e => setData('guardian_name', e.target.value)} className="input" />
                            </div>
                            <div>
                                <label className="label">Guardian Contact</label>
                                <input
                                    value={data.guardian_contact}
                                    onChange={e => setData('guardian_contact', e.target.value)}
                                    className="input"
                                    placeholder="09xxxxxxxxx"
                                />
                            </div>

                            {/* --- Pregnancy --- */}
                            {(data.sex === 'female' || data.sex === 'other') && (
                                <div className="sm:col-span-2 border-t border-gray-100 pt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Pregnancy Information</p>
                                    <div className="flex items-center gap-3 mb-3">
                                        <input
                                            type="checkbox"
                                            id="is_pregnant"
                                            checked={data.is_pregnant}
                                            onChange={e => {
                                                setData('is_pregnant', e.target.checked);
                                                if (!e.target.checked) setData('pregnancy_due_date', '');
                                            }}
                                            className="w-4 h-4 rounded text-clinic-600"
                                        />
                                        <label htmlFor="is_pregnant" className="text-sm text-gray-700">
                                            I am currently pregnant
                                        </label>
                                    </div>
                                    {data.is_pregnant && (
                                        <div>
                                            <label className="label">Expected Due Date <span className="text-gray-400">(optional)</span></label>
                                            <input
                                                type="date"
                                                value={data.pregnancy_due_date}
                                                onChange={e => setData('pregnancy_due_date', e.target.value)}
                                                className={`input ${errors.pregnancy_due_date ? 'input-error' : ''}`}
                                            />
                                            {errors.pregnancy_due_date && <p className="error-msg">{errors.pregnancy_due_date}</p>}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="sm:col-span-2 flex justify-end">
                                <button type="submit" disabled={processing} className="btn-primary">
                                    {processing ? 'Saving…' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}