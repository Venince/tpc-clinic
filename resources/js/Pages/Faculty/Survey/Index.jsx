import { Head, useForm } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function FacultySurvey({ questions, answers, completed }) {
    const initialAnswers = {};
    questions.forEach(q => {
        const existing = answers[q.id]?.answer;
        initialAnswers[q.id] = existing ? (Array.isArray(existing) && q.type !== 'checkbox' ? existing[0] : existing) : (q.type === 'checkbox' ? [] : '');
    });

    const { data, setData, post, processing } = useForm({ answers: initialAnswers });

    const updateAnswer   = (qId, value) => setData('answers', { ...data.answers, [qId]: value });
    const toggleCheckbox = (qId, option) => {
        const current = Array.isArray(data.answers[qId]) ? data.answers[qId] : [];
        const updated  = current.includes(option) ? current.filter(v => v !== option) : [...current, option];
        updateAnswer(qId, updated);
    };

    const submit = (e) => { e.preventDefault(); post(route('faculty.survey.submit')); };

    return (
        <FacultyLayout title="Health Survey">
            <Head title="Health Survey" />

            <div className="max-w-2xl mx-auto">
                <div className="page-header">
                    <div>
                        <h2 className="page-title">Health Survey</h2>
                        <p className="page-subtitle">Please answer all required questions honestly.</p>
                    </div>
                    {completed && (
                        <span className="badge badge-green text-sm px-3 py-1 flex-shrink-0">
                            <CheckCircleIcon className="w-4 h-4 mr-1 inline" />Submitted
                        </span>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {questions.map((q, i) => (
                        <div key={q.id} className="card">
                            <div className="card-body">
                                <p className="text-sm font-medium text-gray-900 mb-3">
                                    {i + 1}. {q.question}
                                    {q.is_required && <span className="text-red-500 ml-1">*</span>}
                                </p>

                                {q.type === 'text' && (
                                    <input value={data.answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)}
                                        className="input" placeholder="Your answer…" />
                                )}
                                {q.type === 'paragraph' && (
                                    <textarea value={data.answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)}
                                        className="input" rows={3} placeholder="Your answer…" />
                                )}
                                {q.type === 'date' && (
                                    <input type="date" value={data.answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)}
                                        className="input w-full sm:w-48" />
                                )}
                                {q.type === 'radio' && q.options?.map(opt => (
                                    <label key={opt} className="flex items-center gap-3 py-2 cursor-pointer">
                                        <input type="radio" name={`q_${q.id}`} value={opt}
                                            checked={data.answers[q.id] === opt}
                                            onChange={() => updateAnswer(q.id, opt)}
                                            className="w-4 h-4 text-clinic-600 focus:ring-clinic-500 flex-shrink-0" />
                                        <span className="text-sm text-gray-700">{opt}</span>
                                    </label>
                                ))}
                                {q.type === 'checkbox' && q.options?.map(opt => (
                                    <label key={opt} className="flex items-center gap-3 py-2 cursor-pointer">
                                        <input type="checkbox" value={opt}
                                            checked={(data.answers[q.id] || []).includes(opt)}
                                            onChange={() => toggleCheckbox(q.id, opt)}
                                            className="w-4 h-4 rounded text-clinic-600 focus:ring-clinic-500 flex-shrink-0" />
                                        <span className="text-sm text-gray-700">{opt}</span>
                                    </label>
                                ))}
                                {q.type === 'dropdown' && (
                                    <select value={data.answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)}
                                        className="input w-full sm:w-64">
                                        <option value="">— Select —</option>
                                        {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                    ))}

                    {questions.length > 0 && (
                        <div className="flex justify-end">
                            <button type="submit" disabled={processing} className="btn-primary btn-lg w-full sm:w-auto">
                                {processing ? 'Submitting…' : completed ? 'Update Survey' : 'Submit Survey'}
                            </button>
                        </div>
                    )}
                    {!questions.length && (
                        <div className="card p-10 text-center text-gray-400">No survey questions yet.</div>
                    )}
                </form>
            </div>
        </FacultyLayout>
    );
}
