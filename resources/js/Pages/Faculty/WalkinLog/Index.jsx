import { Head, router } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function FacultyWalkinLog({ logs }) {
    const [expanded, setExpanded] = useState(null);

    const formatVitals = (vs) => {
        if (!vs) return null;
        const parts = [];
        if (vs.blood_pressure) parts.push(`BP: ${vs.blood_pressure}`);
        if (vs.temperature)    parts.push(`Temp: ${vs.temperature}°C`);
        if (vs.pulse_rate)     parts.push(`Pulse: ${vs.pulse_rate} bpm`);
        if (vs.o2_saturation)  parts.push(`O2: ${vs.o2_saturation}%`);
        if (vs.weight)         parts.push(`Wt: ${vs.weight} kg`);
        return parts.length ? parts.join(' · ') : null;
    };

    return (
        <FacultyLayout title="Walk-in History">
            <Head title="Walk-in History" />
            <div className="max-w-2xl mx-auto">
                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title">Walk-in History</h2>
                        <p className="page-subtitle">Your unscheduled clinic visit records</p>
                    </div>
                </div>

                <div className="card divide-y divide-gray-100">
                    {logs.data.map(log => (
                        <div key={log.id}>
                            <div className="px-4 sm:px-6 py-4 flex items-start justify-between cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm text-gray-900">{log.chief_complaint}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {new Date(log.visited_at).toLocaleString()}
                                    </p>
                                </div>
                                {expanded === log.id
                                    ? <ChevronUpIcon className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0 ml-2" />
                                    : <ChevronDownIcon className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0 ml-2" />}
                            </div>
                            {expanded === log.id && (
                                <div className="px-4 sm:px-6 pb-4 bg-gray-50 space-y-2 pt-3">
                                    {formatVitals(log.vital_signs) && (
                                        <div><p className="text-xs text-gray-400">Vital Signs</p><p className="text-sm text-gray-900">{formatVitals(log.vital_signs)}</p></div>
                                    )}
                                    {log.diagnosis && (
                                        <div><p className="text-xs text-gray-400">Diagnosis</p><p className="text-sm text-gray-900">{log.diagnosis}</p></div>
                                    )}
                                    {log.treatment && (
                                        <div><p className="text-xs text-gray-400">Treatment</p><p className="text-sm text-gray-900">{log.treatment}</p></div>
                                    )}
                                    {log.medicines_dispensed?.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-400">Medicines Given</p>
                                            {log.medicines_dispensed.map((m, i) => (
                                                <p key={i} className="text-sm text-gray-900">{m.name} — {m.quantity} {m.unit}</p>
                                            ))}
                                        </div>
                                    )}
                                    {log.notes && (
                                        <div><p className="text-xs text-gray-400">Notes</p><p className="text-sm text-gray-900">{log.notes}</p></div>
                                    )}
                                    <p className="text-xs text-gray-300 pt-1">Logged by {log.logged_by?.name}</p>
                                </div>
                            )}
                        </div>
                    ))}
                    {!logs.data.length && (
                        <div className="px-6 py-12 text-center text-gray-400 text-sm">No clinic visit records yet.</div>
                    )}
                </div>

                {logs.links?.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-4">
                        {logs.links.map((link, i) => (
                            <button key={i} disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                className={`px-3 py-1 rounded text-xs ${link.active ? 'bg-clinic-600 text-white' : 'hover:bg-gray-100 text-gray-600'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </FacultyLayout>
    );
}