import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/Components/Common/UserAvatar';

const TYPES = ['text', 'paragraph', 'radio', 'checkbox', 'dropdown', 'date'];

export default function SurveyIndex({ questions, responses, filters, role_tab }) {
    const [tab,      setTab]      = useState('questions');
    const [expanded, setExpanded] = useState(null);
    const [search,   setSearch]   = useState(filters?.search || '');
    const [modal,    setModal]    = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        question: '', type: 'text', options: [], is_required: false, is_active: true,
        target_role: role_tab,
    });
    const [optInput, setOptInput] = useState('');

    // Switch between Student / Faculty survey sets
    const switchRoleTab = (rt) => {
        router.get(route('admin.survey.index'), { role_tab: rt }, { preserveState: false });
    };

    const open = (q) => {
        setModal(q || 'new');
        setData(q
            ? { question: q.question, type: q.type, options: q.options || [], is_required: q.is_required, is_active: q.is_active, target_role: q.target_role }
            : { question: '', type: 'text', options: [], is_required: false, is_active: true, target_role: role_tab }
        );
    };

    const addOpt    = () => { if (optInput.trim()) { setData('options', [...data.options, optInput.trim()]); setOptInput(''); } };
    const removeOpt = (i) => setData('options', data.options.filter((_, idx) => idx !== i));

    const submit = (e) => {
        e.preventDefault();
        if (modal === 'new') {
            post(route('admin.survey.store'), { onSuccess: () => { setModal(null); reset(); } });
        } else {
            put(route('admin.survey.update', modal.id), { onSuccess: () => { setModal(null); reset(); } });
        }
    };

    const del        = (q) => { if (confirm('Delete question?')) router.delete(route('admin.survey.destroy', q.id)); };
    const hasOptions = ['radio', 'checkbox', 'dropdown'].includes(data.type);

    const formatAnswer = (answer) => {
        if (!answer && answer !== 0) return <span className="text-gray-400 italic">No answer</span>;
        if (Array.isArray(answer)) return answer.length ? answer.join(', ') : <span className="text-gray-400 italic">No answer</span>;
        return answer;
    };

    return (
        <AdminLayout title="Health Survey">
            <Head title="Survey" />

            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <h2 className="page-title">Health Survey</h2>
                    <p className="page-subtitle">Build and manage the health survey form</p>
                </div>
                {tab === 'questions' && (
                    <button onClick={() => open(null)} className="btn-primary btn-sm whitespace-nowrap">
                        <PlusIcon className="w-4 h-4 mr-1 inline" />Add Question
                    </button>
                )}
            </div>

            {/* Role Tabs — Student vs Faculty */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
                {[['student', 'Student Survey'], ['faculty_staff', 'Faculty/Staff Survey']].map(([key, label]) => (
                    <button key={key} onClick={() => switchRoleTab(key)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            role_tab === key
                                ? 'bg-white text-clinic-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Content Tabs — Questions vs Responses */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
                {[['questions', 'Questions'], ['responses', 'Responses']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            tab === key
                                ? 'border-clinic-600 text-clinic-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}>
                        {label}
                        {key === 'responses' && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                {responses?.total || 0}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Questions Tab */}
            {tab === 'questions' && (
                <>
                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {questions.map((q) => (
                            <div key={q.id} className="card p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm">{q.question}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">#{q.sort_order}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="badge badge-blue text-xs">{q.type}</span>
                                        {q.is_required
                                            ? <span className="badge badge-red text-xs">Required</span>
                                            : <span className="badge badge-gray text-xs">Optional</span>}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 mb-3">
                                    {q.answers_count} response{q.answers_count !== 1 ? 's' : ''}
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                    <button onClick={() => open(q)} className="btn-secondary btn-sm flex-1 flex items-center justify-center gap-1">
                                        <PencilIcon className="w-4 h-4" /> Edit
                                    </button>
                                    <button onClick={() => del(q)} className="btn-danger btn-sm flex-1 flex items-center justify-center gap-1">
                                        <TrashIcon className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {!questions.length && (
                            <div className="card p-8 text-center text-gray-400">
                                No {role_tab === 'student' ? 'student' : 'faculty/staff'} questions yet.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="card hidden md:block">
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr><th>#</th><th>Question</th><th>Type</th><th>Required</th><th>Responses</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {questions.map(q => (
                                        <tr key={q.id}>
                                            <td className="text-gray-400">{q.sort_order}</td>
                                            <td className="font-medium max-w-xs truncate">{q.question}</td>
                                            <td><span className="badge badge-blue text-xs">{q.type}</span></td>
                                            <td>{q.is_required
                                                ? <span className="badge badge-red text-xs">Required</span>
                                                : <span className="badge badge-gray text-xs">Optional</span>}
                                            </td>
                                            <td>{q.answers_count}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button onClick={() => open(q)} className="text-gray-400 hover:text-clinic-600">
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => del(q)} className="text-gray-400 hover:text-red-500">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!questions.length && (
                                        <tr>
                                            <td colSpan={6} className="text-center text-gray-400 py-8">
                                                No {role_tab === 'student' ? 'student' : 'faculty/staff'} questions yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Responses Tab */}
            {tab === 'responses' && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && router.get(route('admin.survey.index'), { search, role_tab }, { preserveState: true })}
                            className="input flex-1" placeholder="Search by name or email…" />
                        <button onClick={() => router.get(route('admin.survey.index'), { search, role_tab }, { preserveState: true })}
                            className="btn-primary btn-sm">Search</button>
                        {search && (
                            <button onClick={() => { setSearch(''); router.get(route('admin.survey.index'), { role_tab }); }}
                                className="btn-secondary btn-sm">Clear</button>
                        )}
                    </div>

                    <div className="card divide-y divide-gray-100">
                        {responses?.data?.map(user => (
                            <div key={user.id}>
                                <div className="px-4 md:px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpanded(expanded === user.id ? null : user.id)}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <UserAvatar user={user} size="md" className="flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 truncate">
                                                {user.email}
                                                {user.student_profile?.program && (
                                                    <span className="ml-2 text-clinic-600 font-medium">
                                                        {user.student_profile.program.code}
                                                    </span>
                                                )}
                                                {user.faculty_profile?.department && (
                                                    <span className="ml-2 text-clinic-600 font-medium">
                                                        {user.faculty_profile.department}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2 shrink-0">
                                        <span className="text-xs text-gray-400 hidden sm:inline">
                                            {user.survey_answers_count} answers
                                        </span>
                                        {expanded === user.id
                                            ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                                            : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {expanded === user.id && (
                                    <div className="px-4 md:px-6 pb-5 bg-gray-50">
                                        {user.survey_answers?.length ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                {user.survey_answers.map(answer => (
                                                    <div key={answer.id} className="bg-white rounded-lg p-3 border border-gray-100">
                                                        <p className="text-xs font-medium text-gray-500 mb-1">
                                                            {answer.question?.question}
                                                            {answer.question?.is_required && <span className="ml-1 text-red-400">*</span>}
                                                        </p>
                                                        <p className="text-sm text-gray-900">{formatAnswer(answer.answer)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 py-3">No answers recorded.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {!responses?.data?.length && (
                            <div className="px-6 py-12 text-center text-gray-400 text-sm">
                                No {role_tab === 'student' ? 'student' : 'faculty/staff'} survey responses yet.
                            </div>
                        )}
                    </div>

                    {responses?.links?.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-1">
                            {responses.links.map((link, i) => (
                                <button key={i} disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, { search, role_tab })}
                                    className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-clinic-600 text-white' : 'hover:bg-gray-100 text-gray-600'} disabled:opacity-40`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Question Modal */}
            {modal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="font-semibold mb-1">
                            {modal === 'new' ? 'Add Question' : 'Edit Question'}
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            {data.target_role === 'student' ? 'Student Survey' : 'Faculty/Staff Survey'}
                        </p>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className="label">Question</label>
                                <textarea value={data.question} onChange={e => setData('question', e.target.value)}
                                    className={`input ${errors.question ? 'input-error' : ''}`} rows={2} />
                                {errors.question && <p className="error-msg">{errors.question}</p>}
                            </div>
                            <div>
                                <label className="label">Type</label>
                                <select value={data.type} onChange={e => setData('type', e.target.value)} className="input">
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            {hasOptions && (
                                <div>
                                    <label className="label">Options</label>
                                    <div className="flex gap-2 mb-2">
                                        <input value={optInput} onChange={e => setOptInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOpt())}
                                            className="input flex-1" placeholder="Add option…" />
                                        <button type="button" onClick={addOpt} className="btn-secondary btn-sm">Add</button>
                                    </div>
                                    <div className="space-y-1">
                                        {data.options.map((o, i) => (
                                            <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded">
                                                <span className="text-sm">{o}</span>
                                                <button type="button" onClick={() => removeOpt(i)}
                                                    className="text-gray-400 hover:text-red-500 text-xs">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="req" checked={data.is_required}
                                    onChange={e => setData('is_required', e.target.checked)}
                                    className="rounded text-clinic-600" />
                                <label htmlFor="req" className="text-sm text-gray-700">Required field</label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={processing} className="btn-primary flex-1">
                                    {processing ? 'Saving…' : 'Save'}
                                </button>
                                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}