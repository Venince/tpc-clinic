import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const TYPES = ['text', 'paragraph', 'radio', 'checkbox', 'dropdown', 'date'];

export default function SurveyIndex({ questions, responses, filters }) {
    const [tab, setTab]           = useState('questions');
    const [expanded, setExpanded] = useState(null);
    const [search, setSearch]     = useState(filters?.search || '');
    const [modal, setModal]       = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        question: '', type: 'text', options: [], is_required: false, is_active: true
    });
    const [optInput, setOptInput] = useState('');

    const open = (q) => {
        setModal(q || 'new');
        setData(q
            ? { question: q.question, type: q.type, options: q.options || [], is_required: q.is_required, is_active: q.is_active }
            : { question: '', type: 'text', options: [], is_required: false, is_active: true }
        );
    };
    const addOpt    = () => { if (optInput.trim()) { setData('options', [...data.options, optInput.trim()]); setOptInput(''); } };
    const removeOpt = (i) => setData('options', data.options.filter((_, idx) => idx !== i));
    const submit    = (e) => {
        e.preventDefault();
        if (modal === 'new') post(route('admin.survey.store'), { onSuccess: () => { setModal(null); reset(); } });
        else put(route('admin.survey.update', modal.id), { onSuccess: () => { setModal(null); reset(); } });
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
            <div className="page-header">
                <div>
                    <h2 className="page-title">Health Survey</h2>
                    <p className="page-subtitle">Build and manage the health survey form</p>
                </div>
                {tab === 'questions' && (
                    <button onClick={() => open(null)} className="btn-primary btn-sm">
                        <PlusIcon className="w-4 h-4 mr-1" />Add Question
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
                {[['questions', 'Questions'], ['responses', 'Responses']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? 'border-clinic-600 text-clinic-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
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
                <div className="card">
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
                                                <button onClick={() => open(q)} className="text-gray-400 hover:text-clinic-600"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => del(q)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!questions.length && <tr><td colSpan={6} className="text-center text-gray-400 py-8">No questions yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Responses Tab */}
            {tab === 'responses' && (
                <div className="space-y-4">
                    {/* Search */}
                    <div className="flex gap-3">
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && router.get(route('admin.survey.index'), { search }, { preserveState: true })}
                            className="input flex-1 max-w-sm" placeholder="Search by name or email…" />
                        <button onClick={() => router.get(route('admin.survey.index'), { search }, { preserveState: true })}
                            className="btn-primary btn-sm">Search</button>
                        {search && (
                            <button onClick={() => { setSearch(''); router.get(route('admin.survey.index')); }}
                                className="btn-secondary btn-sm">Clear</button>
                        )}
                    </div>

                    {/* Response Cards */}
                    <div className="card divide-y divide-gray-100">
                        {responses?.data?.map(user => (
                            <div key={user.id}>
                                {/* Row header */}
                                <div className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpanded(expanded === user.id ? null : user.id)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-clinic-100 text-clinic-700 rounded-full flex items-center justify-center font-semibold text-sm">
                                            {user.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-400">
                                                {user.email}
                                                {user.student_profile?.program &&
                                                    <span className="ml-2 text-clinic-600 font-medium">{user.student_profile.program.code}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400">{user.survey_answers_count} answers</span>
                                        {user.survey_answers?.[0]?.created_at && (
                                            <span className="text-xs text-gray-300">
                                                {new Date(user.survey_answers[0].created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                        {expanded === user.id
                                            ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                                            : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {/* Expanded answers */}
                                {expanded === user.id && (
                                    <div className="px-6 pb-5 bg-gray-50">
                                        {user.survey_answers?.length ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {user.survey_answers.map(answer => (
                                                    <div key={answer.id} className="bg-white rounded-lg p-3 border border-gray-100">
                                                        <p className="text-xs font-medium text-gray-500 mb-1">
                                                            {answer.question?.question}
                                                            {answer.question?.is_required &&
                                                                <span className="ml-1 text-red-400">*</span>}
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
                            <div className="px-6 py-12 text-center text-gray-400 text-sm">No survey responses yet.</div>
                        )}
                    </div>

                    {/* Pagination */}
                    {responses?.links?.length > 3 && (
                        <div className="flex justify-center gap-1">
                            {responses.links.map((link, i) => (
                                <button key={i} disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, { search })}
                                    className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-clinic-600 text-white' : 'hover:bg-gray-100 text-gray-600'} disabled:opacity-40`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Question Modal */}
            {modal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
                        <h3 className="font-semibold mb-4">{modal === 'new' ? 'Add Question' : 'Edit Question'}</h3>
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
                                                <button type="button" onClick={() => removeOpt(i)} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="req" checked={data.is_required}
                                    onChange={e => setData('is_required', e.target.checked)} className="rounded text-clinic-600" />
                                <label htmlFor="req" className="text-sm text-gray-700">Required field</label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={processing} className="btn-primary">{processing ? 'Saving…' : 'Save'}</button>
                                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}