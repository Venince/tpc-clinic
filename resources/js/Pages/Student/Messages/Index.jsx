import { Head, Link, useForm } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';
import { useState } from 'react';
import { PlusIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export default function StudentMessagesIndex({ conversations, contacts }) {
    const [showNew, setShowNew] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ recipient_id:'', subject:'', body:'' });
    const submit = (e) => { e.preventDefault(); post(route('student.messages.store'),{onSuccess:()=>{setShowNew(false);reset();}}); };

    return (
        <StudentLayout title="Messages">
            <Head title="Messages"/>
            <div className="page-header">
                <h2 className="page-title">Messages</h2>
                <button onClick={()=>setShowNew(true)} className="btn-primary btn-sm"><PlusIcon className="w-4 h-4 mr-1"/>New Message</button>
            </div>
            <div className="card">
                <div className="divide-y divide-gray-100">
                    {conversations.data?.map(c=>(
                        <Link key={c.id} href={route('student.messages.show',c.id)} className="block px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{c.subject}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{c.participants?.map(p=>p.name).join(', ')}</p>
                                </div>
                                <div className="text-right">
                                    {c.unread > 0 && <span className="badge badge-red text-xs">{c.unread} new</span>}
                                    <p className="text-xs text-gray-400 mt-1">{c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : ''}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {!conversations.data?.length && (
                        <div className="px-6 py-12 text-center">
                            <ChatBubbleLeftIcon className="w-10 h-10 text-gray-300 mx-auto mb-3"/>
                            <p className="text-gray-400 text-sm">No messages yet.</p>
                            <button onClick={()=>setShowNew(true)} className="btn-primary btn-sm mt-3">Send a Message</button>
                        </div>
                    )}
                </div>
            </div>
            {showNew&&(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-semibold mb-4">New Message to Clinic</h3>
                        <form onSubmit={submit} className="space-y-3">
                            <div><label className="label">To</label>
                                <select value={data.recipient_id} onChange={e=>setData('recipient_id',e.target.value)} className="input">
                                    <option value="">— Select —</option>
                                    {contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>{errors.recipient_id&&<p className="error-msg">{errors.recipient_id}</p>}
                            </div>
                            <div><label className="label">Subject</label><input value={data.subject} onChange={e=>setData('subject',e.target.value)} className="input"/>{errors.subject&&<p className="error-msg">{errors.subject}</p>}</div>
                            <div><label className="label">Message</label><textarea value={data.body} onChange={e=>setData('body',e.target.value)} className="input" rows={4}/>{errors.body&&<p className="error-msg">{errors.body}</p>}</div>
                            <div className="flex gap-3"><button type="submit" disabled={processing} className="btn-primary">{processing?'Sending…':'Send'}</button><button type="button" onClick={()=>setShowNew(false)} className="btn-secondary">Cancel</button></div>
                        </form>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
}
