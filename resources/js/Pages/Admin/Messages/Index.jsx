import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { PlusIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export default function MessagesIndex({ conversations, contacts }) {
    const [showNew, setShowNew] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ recipient_id:'', subject:'', body:'' });

    const submit = (e) => { e.preventDefault(); post(route('admin.messages.store'),{onSuccess:()=>{setShowNew(false);reset();}}); };

    return (
        <AdminLayout title="Messages">
            <Head title="Messages"/>
            <div className="page-header">
                <div><h2 className="page-title">Messages</h2></div>
                <button onClick={()=>setShowNew(true)} className="btn-primary btn-sm"><PlusIcon className="w-4 h-4 mr-1"/>New Message</button>
            </div>
            <div className="card">
                <div className="divide-y divide-gray-100">
                    {conversations.data.map(c=>{
                        const other = c.participants?.filter(p=>true)[0];
                        return (
                            <Link key={c.id} href={route('admin.messages.show',c.id)} className="block px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="w-9 h-9 bg-clinic-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-clinic-700 font-semibold text-sm">{c.participants?.[0]?.name?.charAt(0)}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{c.subject}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{c.participants?.map(p=>p.name).join(', ')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {c.unread > 0 && <span className="badge badge-red text-xs">{c.unread} new</span>}
                                        <p className="text-xs text-gray-400 mt-1">{c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : ''}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                    {!conversations.data?.length && (
                        <div className="px-6 py-12 text-center">
                            <ChatBubbleLeftIcon className="w-10 h-10 text-gray-300 mx-auto mb-3"/>
                            <p className="text-gray-400">No conversations yet.</p>
                            <button onClick={()=>setShowNew(true)} className="btn-primary btn-sm mt-3">Start a Conversation</button>
                        </div>
                    )}
                </div>
            </div>

            {showNew&&(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-semibold mb-4">New Message</h3>
                        <form onSubmit={submit} className="space-y-3">
                            <div><label className="label">To</label>
                                <select value={data.recipient_id} onChange={e=>setData('recipient_id',e.target.value)} className={`input ${errors.recipient_id?'input-error':''}`}>
                                    <option value="">— Select recipient —</option>
                                    {contacts.map(c=><option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                                </select>
                            </div>
                            <div><label className="label">Subject</label><input value={data.subject} onChange={e=>setData('subject',e.target.value)} className={`input ${errors.subject?'input-error':''}`}/></div>
                            <div><label className="label">Message</label><textarea value={data.body} onChange={e=>setData('body',e.target.value)} className={`input ${errors.body?'input-error':''}`} rows={4}/></div>
                            <div className="flex gap-3"><button type="submit" disabled={processing} className="btn-primary">{processing?'Sending…':'Send'}</button><button type="button" onClick={()=>setShowNew(false)} className="btn-secondary">Cancel</button></div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
