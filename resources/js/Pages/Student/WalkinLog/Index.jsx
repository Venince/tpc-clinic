import { Head, router } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';
import { useState, useEffect, useRef } from 'react';
import {
    ChevronDownIcon, ChevronUpIcon,
    ClipboardDocumentCheckIcon, HeartIcon, BeakerIcon,
} from '@heroicons/react/24/outline';

function VitalPill({ label, value }) {
    if (!value) return null;
    return (
        <span className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-xs text-gray-700">
            <span className="text-gray-400 font-medium">{label}</span>
            <span className="font-semibold text-gray-900">{value}</span>
        </span>
    );
}

function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="py-2.5 border-b border-gray-100 last:border-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm text-gray-800 leading-snug">{value}</p>
        </div>
    );
}

export default function StudentWalkinLog({ logs, highlight }) {
    // Auto-expand the highlighted log (from notification deep-link)
    const [expanded, setExpanded] = useState(highlight ? parseInt(highlight) : null);
    const highlightRef = useRef(null);

    // Scroll to the highlighted card once mounted
    useEffect(() => {
        if (highlight && highlightRef.current) {
            setTimeout(() => {
                highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
        }
    }, [highlight]);

    const hasVitals = (vs) => vs && Object.values(vs).some(Boolean);

    const formatDate = (dt) => new Date(dt).toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
    const formatTime = (dt) => new Date(dt).toLocaleTimeString('en-PH', {
        hour: '2-digit', minute: '2-digit',
    });

    return (
        <StudentLayout title="Walk-in History">
            <Head title="Walk-in History" />
            <div className="max-w-2xl mx-auto">

                <div className="mb-5">
                    <h2 className="page-title">Walk-in History</h2>
                    <p className="page-subtitle">Your unscheduled clinic visit records</p>
                </div>

                {logs.data.length > 0 && (
                    <p className="text-xs text-gray-400 mb-3">
                        Showing <span className="font-medium text-gray-600">{logs.data.length}</span> visit{logs.data.length !== 1 ? 's' : ''}
                        {logs.total > logs.data.length && ` of ${logs.total} total`}
                    </p>
                )}

                <div className="space-y-3">
                    {logs.data.map(log => {
                        const isOpen      = expanded === log.id;
                        const isHighlight = highlight && parseInt(highlight) === log.id;
                        const vs          = log.vital_signs;

                        return (
                            <div
                                key={log.id}
                                ref={isHighlight ? highlightRef : null}
                                className={[
                                    'bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-300',
                                    isHighlight
                                        ? 'border-clinic-400 ring-2 ring-clinic-200'
                                        : 'border-gray-200',
                                ].join(' ')}
                            >
                                {/* Highlight banner */}
                                {isHighlight && (
                                    <div className="bg-clinic-50 border-b border-clinic-100 px-4 py-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-clinic-500 animate-pulse" />
                                        <p className="text-xs font-medium text-clinic-700">
                                            This is your most recent clinic visit
                                        </p>
                                    </div>
                                )}

                                {/* Row header */}
                                <button
                                    type="button"
                                    className="w-full text-left px-4 sm:px-5 py-4 flex items-start gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clinic-500 focus-visible:ring-inset"
                                    onClick={() => setExpanded(isOpen ? null : log.id)}
                                    aria-expanded={isOpen}
                                >
                                    <span className={[
                                        'mt-0.5 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                                        isHighlight ? 'bg-clinic-100' : 'bg-clinic-50',
                                    ].join(' ')}>
                                        <ClipboardDocumentCheckIcon className="w-4.5 h-4.5 text-clinic-600" />
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 leading-tight">
                                            {log.chief_complaint}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                            <span className="text-xs text-gray-500">{formatDate(log.visited_at)}</span>
                                            <span className="text-xs text-gray-400">{formatTime(log.visited_at)}</span>
                                        </div>
                                        {!isOpen && hasVitals(vs) && (
                                            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                                <HeartIcon className="w-3 h-3" />
                                                Vitals recorded
                                            </p>
                                        )}
                                    </div>

                                    <span className="flex-shrink-0 mt-1">
                                        {isOpen
                                            ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                                            : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                                    </span>
                                </button>

                                {/* Expanded detail */}
                                {isOpen && (
                                    <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-5 py-4 space-y-4">

                                        {hasVitals(vs) && (
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-2">
                                                    Vital Signs
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <VitalPill label="BP"    value={vs.blood_pressure} />
                                                    <VitalPill label="Temp"  value={vs.temperature ? `${vs.temperature}°C` : null} />
                                                    <VitalPill label="Pulse" value={vs.pulse_rate ? `${vs.pulse_rate} bpm` : null} />
                                                    <VitalPill label="O2"    value={vs.o2_saturation ? `${vs.o2_saturation}%` : null} />
                                                    <VitalPill label="Wt"    value={vs.weight ? `${vs.weight} kg` : null} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-white rounded-lg border border-gray-100 px-4 py-1 divide-y divide-gray-100">
                                            <InfoRow label="Diagnosis" value={log.diagnosis} />
                                            <InfoRow label="Treatment" value={log.treatment} />
                                            <InfoRow label="Notes"     value={log.notes} />
                                        </div>

                                        {log.medicines_dispensed?.length > 0 && (
                                            <div>
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1">
                                                    <BeakerIcon className="w-3 h-3" /> Medicines Given
                                                </p>
                                                <div className="space-y-1.5">
                                                    {log.medicines_dispensed.map((m, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                                                            <span className="text-sm text-gray-900 font-medium">{m.name}</span>
                                                            <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                                                                {m.quantity} {m.unit}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-[11px] text-gray-400">
                                            Logged by <span className="font-medium">{log.logged_by?.name}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {!logs.data.length && (
                        <div className="bg-white rounded-xl border border-dashed border-gray-200 px-6 py-14 text-center">
                            <ClipboardDocumentCheckIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-400">No clinic visit records yet</p>
                            <p className="text-xs text-gray-300 mt-1">Walk-in visits logged by clinic staff will appear here.</p>
                        </div>
                    )}
                </div>

                {logs.links?.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-5">
                        {logs.links.map((link, i) => (
                            <button key={i} disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    link.active
                                        ? 'bg-clinic-600 text-white'
                                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
