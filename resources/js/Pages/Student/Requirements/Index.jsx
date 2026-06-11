import { Head, useForm } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';
import { useState } from 'react';
import { ArrowUpTrayIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function StudentRequirements({ types, requirements }) {
    const [uploading, setUploading] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({ requirement_type_id: '', file: null });

    const openUpload = (type) => { setUploading(type); setData('requirement_type_id', type.id); };
    const submit = (e) => {
        e.preventDefault();
        post(route('student.requirements.upload'), {
            forceFormData: true,
            onSuccess: () => { setUploading(null); reset(); },
        });
    };

    const statusIcon = (status) => {
        if (status === 'approved')  return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        if (status === 'rejected')  return <XCircleIcon className="w-5 h-5 text-red-500" />;
        if (status === 'pending')   return <ClockIcon className="w-5 h-5 text-yellow-500" />;
        return <ArrowUpTrayIcon className="w-5 h-5 text-gray-400" />;
    };

    const statusBadge = (status) => {
        if (!status) return <span className="badge badge-gray">Not Uploaded</span>;
        const map = { approved: 'badge-green', pending: 'badge-yellow', rejected: 'badge-red' };
        return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
    };

    return (
        <StudentLayout title="Medical Requirements">
            <Head title="Requirements" />

            <div className="page-header">
                <div>
                    <h2 className="page-title">Medical Requirements</h2>
                    <p className="page-subtitle">Upload your required medical documents</p>
                </div>
            </div>

            <div className="space-y-4">
                {types.map(type => {
                    const req = requirements[type.id];
                    return (
                        <div key={type.id} className="card">
                            <div className="card-body flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {statusIcon(req?.approval_status)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 break-words">{type.name}</p>
                                        {type.description && <p className="text-xs text-gray-400 mt-0.5 break-words">{type.description}</p>}
                                        {req && (
                                            <div className="mt-2 space-y-1">
                                                <p className="text-xs text-gray-500 break-all">
                                                    File: <span className="font-medium">{req.original_filename}</span>
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Uploaded: {new Date(req.created_at).toLocaleDateString()}
                                                </p>
                                                {req.reviewed_at && (
                                                    <p className="text-xs text-gray-400">
                                                        Reviewed: {new Date(req.reviewed_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                                {req.rejection_reason && (
                                                    <p className="text-xs text-red-500 mt-1 break-words">
                                                        Reason: {req.rejection_reason}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 sm:flex-col sm:items-end">
                                    {statusBadge(req?.approval_status)}
                                    <button onClick={() => openUpload(type)} className="btn-secondary btn-sm whitespace-nowrap">
                                        <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
                                        {req ? 'Re-upload' : 'Upload'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {!types.length && (
                    <div className="card p-10 text-center text-gray-400">No requirements have been set up yet.</div>
                )}
            </div>

            {/* Upload Modal */}
            {uploading && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="font-semibold text-gray-900 mb-1 break-words">Upload: {uploading.name}</h3>
                        <p className="text-xs text-gray-400 mb-4">Accepted: PDF, JPG, PNG, DOC, DOCX (max 10MB)</p>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="label">Select File</label>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={e => setData('file', e.target.files[0])}
                                    className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-clinic-50 file:text-clinic-700 hover:file:bg-clinic-100 ${errors.file ? 'text-red-500' : ''}`} />
                                {errors.file && <p className="error-msg">{errors.file}</p>}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button type="submit" disabled={processing || !data.file} className="btn-primary flex-1 order-1 sm:order-1">
                                    {processing ? 'Uploading…' : 'Upload File'}
                                </button>
                                <button type="button" onClick={() => { setUploading(null); reset(); }} className="btn-secondary order-2">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
}