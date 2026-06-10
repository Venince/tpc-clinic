import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function AnnouncementsIndex({ announcements }) {
    const [modal, setModal] = useState(null);
    const { data, setData, post, put, processing, reset } = useForm({ title:'', content:'', category:'general', is_published:false, expires_at:'' });

    const open = (a) => { setModal(a||'new'); setData(a?{ title:a.title, content:a.content, category:a.category, is_published:a.is_published, expires_at:a.expires_at||'' }:{ title:'', content:'', category:'general', is_published:false, expires_at:'' }); };
    const submit = (e) => { e.preventDefault(); if(modal==='new') post(route('admin.announcements.store'),{onSuccess:()=>{setModal(null);reset();}}); else put(route('admin.announcements.update',modal.id),{onSuccess:()=>{setModal(null);reset();}}); };
    const del = (a) => { if(confirm('Delete announcement?')) router.delete(route('admin.announcements.destroy',a.id)); };

    const catBadge = (c) => ({ general:'badge-blue', health:'badge-green', event:'badge-purple' })[c] || 'badge-gray';

    return (
        <AdminLayout title="Announcements">
            <Head title="Announcements"/>
            <div className="page-header">
                <div><h2 className="page-title">Announcements</h2></div>
                <button onClick={()=>open(null)} className="btn-primary btn-sm"><PlusIcon className="w-4 h-4 mr-1"/>New Announcement</button>
            </div>
            <div className="card">
                <div className="divide-y divide-gray-100">
                    {announcements.data.map(a=>(
                        <div key={a.id} className="px-6 py-4 flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-gray-900">{a.title}</p>
                                    <span className={`badge ${catBadge(a.category)} text-xs`}>{a.category}</span>
                                    {!a.is_published&&<span className="badge badge-gray text-xs">Draft</span>}
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{a.content}</p>
                                <p className="text-xs text-gray-400 mt-1">By {a.creator?.name} · {a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Not published'}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={()=>open(a)} className="text-gray-400 hover:text-clinic-600"><PencilIcon className="w-4 h-4"/></button>
                                <button onClick={()=>del(a)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                    {!announcements.data.length&&<div className="px-6 py-10 text-center text-gray-400">No announcements yet.</div>}
                </div>
            </div>

            {modal!==null&&(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-screen overflow-y-auto">
                        <h3 className="font-semibold mb-4">{modal==='new'?'New Announcement':'Edit Announcement'}</h3>
                        <form onSubmit={submit} className="space-y-3">
                            <div><label className="label">Title</label><input value={data.title} onChange={e=>setData('title',e.target.value)} className="input"/></div>
                            <div><label className="label">Content</label><textarea value={data.content} onChange={e=>setData('content',e.target.value)} className="input" rows={4}/></div>
                            <div><label className="label">Category</label>
                                <select value={data.category} onChange={e=>setData('category',e.target.value)} className="input">
                                    <option value="general">General</option>
                                    <option value="health">Health</option>
                                    <option value="event">Event</option>
                                </select>
                            </div>
                            <div><label className="label">Expires At (optional)</label><input type="datetime-local" value={data.expires_at} onChange={e=>setData('expires_at',e.target.value)} className="input"/></div>
                            <div className="flex items-center gap-2"><input type="checkbox" id="pub" checked={data.is_published} onChange={e=>setData('is_published',e.target.checked)} className="rounded text-clinic-600"/><label htmlFor="pub" className="text-sm text-gray-700">Publish immediately</label></div>
                            <div className="flex gap-3 pt-2"><button type="submit" disabled={processing} className="btn-primary">{processing?'Saving…':'Save'}</button><button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancel</button></div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
