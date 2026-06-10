import { Head, router, useForm } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import { useState } from 'react';
import { CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function FacultyAppointments({ appointments, slots }) {
    const [showBook, setShowBook] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ appointment_slot_id:'', purpose:'', notes:'' });

    const submit = (e) => { e.preventDefault(); post(route('faculty.appointments.store'),{onSuccess:()=>{setShowBook(false);reset();}}); };
    const cancel = (id) => { if(confirm('Cancel this appointment?')) router.post(route('faculty.appointments.cancel',id)); };

    const statusBadge = (s) => {
        const map = { pending:'badge-yellow', approved:'badge-green', declined:'badge-red', completed:'badge-purple', cancelled:'badge-gray' };
        return <span className={`badge ${map[s]||'badge-gray'}`}>{s}</span>;
    };

    return (
        <FacultyLayout title="My Appointments">
            <Head title="Appointments"/>
            <div className="page-header">
                <div><h2 className="page-title">Appointments</h2><p className="page-subtitle">Book and manage your clinic appointments</p></div>
                <button onClick={()=>setShowBook(true)} className="btn-primary"><CalendarIcon className="w-4 h-4 mr-2"/>Book Appointment</button>
            </div>

            {slots?.length > 0 && (
                <div className="card mb-6">
                    <div className="card-header"><h3 className="font-semibold text-gray-900 text-sm">Available Slots</h3></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                        {slots.slice(0,8).map(slot=>(
                            <button key={slot.id} onClick={()=>{setData('appointment_slot_id',slot.id);setShowBook(true);}}
                                className="text-left p-3 rounded-lg border border-clinic-200 bg-clinic-50 hover:bg-clinic-100 transition-colors">
                                <p className="text-xs font-semibold text-clinic-700">{new Date(slot.date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</p>
                                <p className="text-xs text-clinic-600 mt-0.5">{slot.start_time} – {slot.end_time}</p>
                                <p className="text-xs text-gray-400 mt-1">{slot.available_slots ?? slot.max_appointments - slot.booked_count} slot(s) left</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead><tr><th>Purpose</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {appointments.data.map(a=>(
                                <tr key={a.id}>
                                    <td className="font-medium">{a.purpose}</td>
                                    <td>{a.slot?.date}</td>
                                    <td>{a.slot?.start_time}</td>
                                    <td>{statusBadge(a.status)}{a.status==='declined'&&a.decline_reason&&<p className="text-xs text-red-500 mt-1">{a.decline_reason}</p>}</td>
                                    <td>{['pending','approved'].includes(a.status)&&<button onClick={()=>cancel(a.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><XMarkIcon className="w-3.5 h-3.5"/>Cancel</button>}</td>
                                </tr>
                            ))}
                            {!appointments.data.length&&<tr><td colSpan={5} className="text-center text-gray-400 py-8">No appointments yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {showBook&&(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Book Appointment</h3>
                            <button onClick={()=>{setShowBook(false);reset();}} className="text-gray-400"><XMarkIcon className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            <div><label className="label">Select Slot</label>
                                <select value={data.appointment_slot_id} onChange={e=>setData('appointment_slot_id',e.target.value)} className={`input ${errors.appointment_slot_id?'input-error':''}`}>
                                    <option value="">— Choose a slot —</option>
                                    {slots.map(s=><option key={s.id} value={s.id}>{s.date} · {s.start_time}–{s.end_time} ({(s.available_slots ?? s.max_appointments - s.booked_count)} available)</option>)}
                                </select>{errors.appointment_slot_id&&<p className="error-msg">{errors.appointment_slot_id}</p>}
                            </div>
                            <div><label className="label">Purpose</label>
                                <input value={data.purpose} onChange={e=>setData('purpose',e.target.value)} className={`input ${errors.purpose?'input-error':''}`} placeholder="e.g. General check-up…"/>
                                {errors.purpose&&<p className="error-msg">{errors.purpose}</p>}
                            </div>
                            <div><label className="label">Notes (optional)</label><textarea value={data.notes} onChange={e=>setData('notes',e.target.value)} className="input" rows={2}/></div>
                            <div className="flex gap-3">
                                <button type="submit" disabled={processing} className="btn-primary flex-1">{processing?'Booking…':'Book Appointment'}</button>
                                <button type="button" onClick={()=>{setShowBook(false);reset();}} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </FacultyLayout>
    );
}
