import { Head, router } from '@inertiajs/react';
import FacultyLayout from '@/Layouts/FacultyLayout';
import { useState, useEffect, useRef } from 'react';
import {
    ChevronDownIcon, ChevronUpIcon,
    ClipboardDocumentCheckIcon, HeartIcon, BeakerIcon, CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const formatFollowUpDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
});
const formatFollowUpTime = (timeStr) => timeStr
    ? new Date(`1970-01-01T${timeStr}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

function VitalPill({ label, value }) {
    if (!value) return null;
    return (
        <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-xs text-gray-700">
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

function FollowUpChip({ log, compact }) {
    if (log.follow_up_status !== 'scheduled') return null;
    const time = formatFollowUpTime(log.follow_up_time);
    return (
        <span className={`inline-flex items-center gap-1 font-medium text-clinic-700 bg-clinic-50 border border-clinic-100 rounded-full ${compact ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
            <CalendarDaysIcon className="w-3 h-3" />
            Follow-up {formatFollowUpDate(log.follow_up_date)}{time ? ` · ${time}` : ''}
        </span>
    );
}

const hasVitals = (vs) => vs && Object.values(vs).some(Boolean);

const formatDate = (dt) => new Date(dt).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
});
const formatTime = (dt) => new Date(dt).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit',
});
const monthKey = (dt) => new Date(dt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

function LogDetailBody({ log }) {
    const vs = log.vital_signs;
    return (
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-4">
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

                <div className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-1 divide-y divide-gray-100">
                    <InfoRow label="Diagnosis" value={log.diagnosis} />
                    <InfoRow label="Treatment" value={log.treatment} />
                    <InfoRow label="Notes"     value={log.notes} />
                </div>
            </div>

            <div className="space-y-4">
                {log.medicines_dispensed?.length > 0 && (
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1">
                            <BeakerIcon className="w-3 h-3" /> Medicines Given
                        </p>
                        <div className="space-y-1.5">
                            {log.medicines_dispensed.map((m, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                    <span className="text-sm text-gray-900 font-medium">{m.name}</span>
                                    <span className="text-xs text-gray-500 bg-white rounded-full px-2 py-0.5 border border-gray-100">
                                        {m.quantity} {m.unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {log.follow_up_status === 'scheduled' && (
                    <div className="bg-clinic-50 border border-clinic-100 rounded-xl px-3.5 py-3 flex items-start gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-clinic-100 flex items-center justify-center flex-shrink-0">
                            <CalendarDaysIcon className="w-4 h-4 text-clinic-600" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-clinic-700 leading-snug">
                                Follow-up visit on {formatFollowUpDate(log.follow_up_date)}
                                {log.follow_up_time && ` at ${formatFollowUpTime(log.follow_up_time)}`}
                            </p>
                            {log.follow_up_notes && (
                                <p className="text-xs text-clinic-600 mt-0.5 leading-snug">{log.follow_up_notes}</p>
                            )}
                        </div>
                    </div>
                )}

                <p className="text-[11px] text-gray-400">
                    Logged by <span className="font-medium">{log.logged_by?.name}</span>
                </p>
            </div>
        </div>
    );
}

export default function FacultyWalkinLog({ logs, highlight }) {
    const [expanded, setExpanded] = useState(highlight ? parseInt(highlight) : (logs.data[0]?.id ?? null));
    const highlightRef = useRef(null);

    useEffect(() => {
        if (highlight && highlightRef.current) {
            setTimeout(() => {
                highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
        }
    }, [highlight]);

    const Pagination = () => logs.links?.length > 3 && (
        <div className="flex flex-wrap justify-center gap-1 mt-6">
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
    );

    let lastMonth = null;

    return (
        <FacultyLayout title="Walk-in History">
            <Head title="Walk-in History" />

            <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
                <p className="page-subtitle">Your unscheduled clinic visit records</p>
                {logs.data.length > 0 && (
                    <p className="text-xs text-gray-400">
                        Showing <span className="font-medium text-gray-600">{logs.data.length}</span> visit{logs.data.length !== 1 ? 's' : ''}
                        {logs.total > logs.data.length && ` of ${logs.total} total`}
                    </p>
                )}
            </div>

            {!logs.data.length ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 px-6 py-14 text-center max-w-2xl mx-auto">
                    <ClipboardDocumentCheckIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">No clinic visit records yet</p>
                    <p className="text-xs text-gray-300 mt-1">Walk-in visits logged by clinic staff will appear here.</p>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto">
                    {logs.data.map((log, idx) => {
                        const isOpen      = expanded === log.id;
                        const isHighlight = highlight && parseInt(highlight) === log.id;
                        const month       = monthKey(log.visited_at);
                        const showHeader  = month !== lastMonth;
                        lastMonth = month;
                        const isLast = idx === logs.data.length - 1;

                        return (
                            <div key={log.id}>
                                {showHeader && (
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3 mt-6 first:mt-0 pl-[52px] sm:pl-[60px]">
                                        {month}
                                    </p>
                                )}
                                <div className="relative flex gap-3 sm:gap-4 pb-5" ref={isHighlight ? highlightRef : null}>
                                    {!isLast && (
                                        <span className="absolute left-[19px] sm:left-[21px] top-11 bottom-0 w-px bg-gray-200" />
                                    )}
                                    <span className={[
                                        'relative z-10 mt-0.5 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm',
                                        isHighlight ? 'bg-clinic-600 ring-4 ring-clinic-100' : 'bg-gradient-to-br from-clinic-500 to-clinic-600',
                                    ].join(' ')}>
                                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-white" />
                                    </span>

                                    <div className={[
                                        'flex-1 min-w-0 bg-white rounded-2xl border shadow-sm overflow-hidden transition-all',
                                        isHighlight ? 'border-clinic-300 ring-2 ring-clinic-100' : 'border-gray-200',
                                    ].join(' ')}>
                                        {isHighlight && (
                                            <div className="bg-clinic-50 border-b border-clinic-100 px-4 py-1.5 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-clinic-500 animate-pulse" />
                                                <p className="text-[11px] font-medium text-clinic-700">Opened from your notification</p>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className="w-full text-left px-4 sm:px-5 py-4 flex items-start gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clinic-500 focus-visible:ring-inset"
                                            onClick={() => setExpanded(isOpen ? null : log.id)}
                                            aria-expanded={isOpen}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-gray-900 leading-tight break-words">
                                                    {log.chief_complaint}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                                    <span className="text-xs text-gray-500">{formatDate(log.visited_at)}</span>
                                                    <span className="text-xs text-gray-400">{formatTime(log.visited_at)}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    {!isOpen && hasVitals(log.vital_signs) && (
                                                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                            <HeartIcon className="w-3 h-3" /> Vitals recorded
                                                        </span>
                                                    )}
                                                    <FollowUpChip log={log} compact />
                                                </div>
                                            </div>
                                            <span className="flex-shrink-0 mt-1">
                                                {isOpen
                                                    ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                                                    : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                                            </span>
                                        </button>

                                        {isOpen && (
                                            <div className="border-t border-gray-100 bg-gray-50/60 px-4 sm:px-5 py-4">
                                                <LogDetailBody log={log} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <Pagination />
                </div>
            )}
        </FacultyLayout>
    );
}
