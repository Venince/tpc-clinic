import { Head, Link, useForm, usePage } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function FacultyMessageShow({ conversation, messages }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, reset } = useForm({ body: '' });
    const submit = (e) => { e.preventDefault(); post(route('faculty.messages.reply', conversation.id), { onSuccess: () => reset() }); };

    return (
        <FacultyLayout title={conversation.subject}>
            <Head title={conversation.subject}/>
            <div className="max-w-2xl mx-auto">
                <Link href={route('faculty.messages.index')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
                    <ArrowLeftIcon className="w-4 h-4"/> Back
                </Link>
                <div className="card">
                    <div className="card-header">
                        <h2 className="font-semibold text-gray-900">{conversation.subject}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {conversation.participants?.map(p => p.name).join(', ')}
                        </p>
                    </div>
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {messages.data?.slice().reverse().map(msg => {
                            const isMine = msg.sender_id === auth.user?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-clinic-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                        {!isMine && <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender?.name}</p>}
                                        <p>{msg.body}</p>
                                        <p className={`text-xs mt-1 ${isMine ? 'text-clinic-200' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="p-4 border-t border-gray-100">
                        <form onSubmit={submit} className="flex gap-2">
                            <textarea value={data.body} onChange={e => setData('body', e.target.value)}
                                className="input flex-1 resize-none" rows={2} placeholder="Type your reply…"/>
                            <button type="submit" disabled={processing || !data.body.trim()} className="btn-primary self-end px-3 py-2">
                                <PaperAirplaneIcon className="w-5 h-5"/>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </FacultyLayout>
    );
}