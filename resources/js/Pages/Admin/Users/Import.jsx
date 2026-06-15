import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowUpTrayIcon, ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function UsersImport({ roles }) {
    const { data, setData, post, processing, errors, progress } = useForm({
        file: null,
        role: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.users.import.store'), {
            forceFormData: true,
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) setData('file', file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <AdminLayout title="Bulk Import Users">
            <Head title="Bulk Import" />

            <div className="page-header">
                <div>
                    <h2 className="page-title">Bulk Import Users</h2>
                    <p className="page-subtitle">Upload a .txt file with one email per line</p>
                </div>
                <Link href={route('admin.users.index')} className="btn-secondary btn-sm">
                    <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Users
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="card-body">
                            <form onSubmit={submit} className="space-y-5">
                                {/* Role */}
                                <div>
                                    <label className="label">Assign Role <span className="text-red-500">*</span></label>
                                    <select
                                        value={data.role}
                                        onChange={e => setData('role', e.target.value)}
                                        className="input"
                                    >
                                        <option value="">Select a role…</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.name}>{r.display_name}</option>
                                        ))}
                                    </select>
                                    {errors.role && <p className="error-text">{errors.role}</p>}
                                </div>

                                {/* File */}
                                <div>
                                    <label className="label">Email List File (.txt) <span className="text-red-500">*</span></label>
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${data.file ? 'border-clinic-400 bg-clinic-50' : 'border-gray-200 hover:border-clinic-300'}`}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                    >
                                        {data.file ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <DocumentTextIcon className="w-8 h-8 text-clinic-500" />
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-gray-900">{data.file.name}</p>
                                                    <p className="text-xs text-gray-400">{(data.file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('file', null)}
                                                    className="text-xs text-red-500 hover:underline ml-2"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer">
                                                <ArrowUpTrayIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                                                <p className="text-xs text-gray-400 mt-1">.txt files only, max 2MB</p>
                                                <input
                                                    type="file"
                                                    accept=".txt"
                                                    className="hidden"
                                                    onChange={e => setData('file', e.target.files[0] ?? null)}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    {errors.file && <p className="error-text">{errors.file}</p>}
                                </div>

                                {/* Upload progress */}
                                {progress && (
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className="bg-clinic-500 h-1.5 rounded-full transition-all"
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing || !data.file || !data.role}
                                    className="btn-primary w-full"
                                >
                                    {processing ? 'Importing…' : 'Import Users'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                    <div className="card">
                        <div className="card-body">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">File Format</h3>
                            <p className="text-xs text-gray-500 mb-3">One email address per line. Lines that are blank or invalid are skipped.</p>
                            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600 space-y-1">
                                <p>juan.delacruz@tpc.edu.ph</p>
                                <p>maria.santos@tpc.edu.ph</p>
                                <p>jose.reyes@tpc.edu.ph</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">What happens</h3>
                            <ul className="text-xs text-gray-500 space-y-2">
                                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> New users are created with a random password</li>
                                <li className="flex gap-2"><span className="text-blue-500 font-bold">→</span> Credentials are emailed to each user</li>
                                <li className="flex gap-2"><span className="text-yellow-500 font-bold">⊘</span> Existing emails are skipped</li>
                                <li className="flex gap-2"><span className="text-red-500 font-bold">✕</span> Invalid emails are skipped</li>
                                <li className="flex gap-2"><span className="text-orange-500 font-bold">!</span> Users must change password on first login</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}