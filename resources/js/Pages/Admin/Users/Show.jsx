import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserAvatar from '@/Components/Common/UserAvatar';
import PhotoLightbox from '@/Components/Common/PhotoLightbox';
import { useRef, useState, useEffect } from 'react';
import {
    ArrowLeftIcon, CalendarIcon, BeakerIcon, ClipboardDocumentListIcon,
    DocumentTextIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, IdentificationIcon,
    BriefcaseIcon, HeartIcon, PrinterIcon, ArrowDownTrayIcon, ChevronDownIcon,
    UserGroupIcon, ShieldCheckIcon, ClockIcon,
} from '@heroicons/react/24/outline';

const STATUS_BADGES = {
    pending: 'badge-yellow', approved: 'badge-blue', declined: 'badge-red',
    rejected: 'badge-red', completed: 'badge-green', released: 'badge-green',
    cancelled: 'badge-gray', verified: 'badge-green', under_review: 'badge-yellow',
};

function StatusBadge({ status }) {
    if (!status) return <span className="text-gray-300 text-xs">—</span>;
    return <span className={`badge ${STATUS_BADGES[status] || 'badge-gray'} text-xs capitalize`}>{status.replace('_', ' ')}</span>;
}

function SectionCard({ icon: Icon, title, count, children }) {
    return (
        <div className="card print-card">
            <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-clinic-600 print-hide" />
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                </div>
                {count !== undefined && (
                    <span className="text-xs text-gray-400">{count} record{count === 1 ? '' : 's'}</span>
                )}
            </div>
            <div className="card-body p-0">{children}</div>
        </div>
    );
}

function EmptyState({ label }) {
    return <p className="text-sm text-gray-400 text-center py-8">{label}</p>;
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 print-hide" />
            <div className="min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-900 break-words">{value || '—'}</p>
            </div>
        </div>
    );
}

export default function UserShow({ user, appointments, medicineRequests, surveyAnswers, requirements }) {
    const u = user;
    const roleName = u?.role?.name;
    const student = u?.student_profile;
    const faculty = u?.faculty_profile;

    const printRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [photoOpen, setPhotoOpen] = useState(false);

    useEffect(() => {
        const close = () => setMenuOpen(false);
        if (menuOpen) document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [menuOpen]);

    const handlePrint = () => {
        setMenuOpen(false);
        window.print();
    };

    const handleDownloadImage = async () => {
        setMenuOpen(false);
        setDownloading(true);
        try {
            if (!window.html2canvas) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }
            const canvas = await window.html2canvas(printRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
            });
            const link = document.createElement('a');
            link.download = `${(u?.name || 'user').replace(/\s+/g, '_')}_profile.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error(err);
            alert('Failed to generate image. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    // Subtitle under the name — varies by role
    const subtitle = roleName === 'student'
        ? [student?.program?.code, student?.year_level ? `Year ${student.year_level}` : null].filter(Boolean).join(' — ')
        : roleName === 'faculty_staff'
            ? [faculty?.position, faculty?.department].filter(Boolean).join(' — ')
            : u?.role?.display_name;

    const isPregnant = student?.is_pregnant || faculty?.is_pregnant;
    const pregnancyDueDate = student?.pregnancy_due_date || faculty?.pregnancy_due_date;
    const medicalNotes = student?.medical_notes || faculty?.medical_notes;

    return (
        <AdminLayout title="User Profile">
            <Head title={`User: ${u?.name}`} />

            <style>{`
                @media print {
                    .print-hide { display: none !important; }
                    aside, header, .no-print { display: none !important; }
                    main { padding: 0 !important; overflow: visible !important; }
                    body { background: #fff !important; }
                    .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; break-inside: avoid; }
                    .print-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
                    .print-header { border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 16px; }
                    .print-logo { display: flex !important; }
                    @page { margin: 1.5cm; size: A4; }
                }
                .print-logo { display: none; }
            `}</style>

            <div className="flex items-center justify-between mb-4 no-print">
                <Link href={route('admin.users.index')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="w-4 h-4" /> Back to Users
                </Link>

                <div className="flex items-center gap-2">
                    <Link href={route('admin.users.edit', u.id)} className="btn-secondary btn-sm">
                        Edit
                    </Link>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
                            disabled={downloading}
                            className="btn-primary btn-sm"
                        >
                            {downloading ? 'Generating…' : 'Export'}
                            {!downloading && <ChevronDownIcon className="w-4 h-4 ml-1" />}
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                                <button onClick={handlePrint} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                                    <PrinterIcon className="w-4 h-4 text-gray-400" /> Print
                                </button>
                                <button onClick={handleDownloadImage} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                                    <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" /> Download as Image
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div ref={printRef} className="bg-gray-50 print:bg-white">
                <div className="print-logo print-header items-center gap-3 mb-4" style={{ display: 'none' }}>
                    <img src="/images/tpc-logo.png" alt="TPC Logo" className="w-12 h-12 object-contain" />
                    <div>
                        <p className="font-bold text-gray-900 text-base">TPC e-Clinic — User Profile</p>
                        <p className="text-xs text-gray-500">Generated: {new Date().toLocaleString()}</p>
                    </div>
                </div>

                {/* Profile Header */}
                <div className="card mb-6 print-card">
                    <div className="card-body">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                            <UserAvatar user={u} size="xl" className="flex-shrink-0" onClick={() => setPhotoOpen(true)} />
                            <div className="flex-1 min-w-0 w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                                    <h2 className="text-xl font-bold text-gray-900 break-words">{u?.name}</h2>
                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                        <span className={`badge ${u?.is_active ? 'badge-green' : 'badge-red'}`}>{u?.is_active ? 'Active' : 'Inactive'}</span>
                                        <span className="badge badge-gray capitalize">{roleName?.replace('_', ' ')}</span>
                                        {isPregnant && <span className="badge badge-red">Pregnant</span>}
                                    </div>
                                </div>
                                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print-grid gap-4 mt-5 text-left">
                                    <InfoRow icon={EnvelopeIcon} label="Email" value={u?.email} />

                                    {roleName === 'student' && (
                                        <>
                                            <InfoRow icon={IdentificationIcon} label="Student ID" value={student?.student_id} />
                                            <InfoRow icon={PhoneIcon} label="Contact Number" value={student?.contact_number} />
                                            <InfoRow icon={CalendarIcon} label="Birth Date" value={student?.birth_date ? new Date(student.birth_date).toLocaleDateString() : null} />
                                            <InfoRow icon={UserGroupIcon} label="Year & Block" value={student?.year_level ? `Year ${student.year_level}${student.block ? ` - ${student.block}` : ''}` : null} />
                                            <InfoRow icon={IdentificationIcon} label="Sex / Civil Status" value={[student?.sex, student?.civil_status].filter(Boolean).join(' / ')} />
                                            <InfoRow icon={MapPinIcon} label="Address" value={student?.address} />
                                            <InfoRow icon={UserGroupIcon} label="Guardian" value={student?.guardian_name} />
                                            <InfoRow icon={PhoneIcon} label="Guardian Contact" value={student?.guardian_contact} />
                                        </>
                                    )}

                                    {roleName === 'faculty_staff' && (
                                        <>
                                            <InfoRow icon={IdentificationIcon} label="Employee ID" value={faculty?.employee_id} />
                                            <InfoRow icon={PhoneIcon} label="Contact Number" value={faculty?.contact_number} />
                                            <InfoRow icon={CalendarIcon} label="Birth Date" value={faculty?.birth_date ? new Date(faculty.birth_date).toLocaleDateString() : null} />
                                            <InfoRow icon={BriefcaseIcon} label="Department / Position" value={[faculty?.department, faculty?.position].filter(Boolean).join(' / ')} />
                                            <InfoRow icon={IdentificationIcon} label="Sex / Civil Status" value={[faculty?.sex, faculty?.civil_status].filter(Boolean).join(' / ')} />
                                            <InfoRow icon={MapPinIcon} label="Address" value={faculty?.address} />
                                        </>
                                    )}

                                    {(roleName === 'admin' || roleName === 'super_admin') && (
                                        <>
                                            <InfoRow icon={ShieldCheckIcon} label="Role" value={u?.role?.display_name} />
                                            <InfoRow icon={ClockIcon} label="Last Login" value={u?.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'} />
                                        </>
                                    )}

                                    {isPregnant && (
                                        <InfoRow icon={HeartIcon} label="Pregnancy Due Date" value={pregnancyDueDate ? new Date(pregnancyDueDate).toLocaleDateString() : null} />
                                    )}
                                    {medicalNotes && (
                                        <div className="sm:col-span-2 lg:col-span-3">
                                            <InfoRow icon={DocumentTextIcon} label="Medical Notes" value={medicalNotes} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 print-grid gap-6">
                    {/* Appointments */}
                    <SectionCard icon={CalendarIcon} title="Appointment Records" count={appointments.length}>
                        {appointments.length ? (
                            <div className="divide-y divide-gray-100">
                                {appointments.map(a => (
                                    <div key={a.id} className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 break-words">{a.purpose || 'General Consultation'}</p>
                                            <p className="text-xs text-gray-400">
                                                {a.slot?.date ? new Date(a.slot.date).toLocaleDateString() : '—'}
                                                {a.slot?.start_time ? ` • ${a.slot.start_time}` : ''}
                                            </p>
                                        </div>
                                        <StatusBadge status={a.status} />
                                    </div>
                                ))}
                            </div>
                        ) : <EmptyState label="No appointment records." />}
                    </SectionCard>

                    {/* Medicine Requests */}
                    <SectionCard icon={BeakerIcon} title="Medicine Requests" count={medicineRequests.length}>
                        {medicineRequests.length ? (
                            <div className="divide-y divide-gray-100">
                                {medicineRequests.map(m => (
                                    <div key={m.id} className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 break-words">{m.medicine?.name}</p>
                                            <p className="text-xs text-gray-400">
                                                Qty: {m.quantity_requested} {m.medicine?.unit}
                                                {m.quantity_released ? ` • Released: ${m.quantity_released}` : ''}
                                            </p>
                                        </div>
                                        <StatusBadge status={m.status} />
                                    </div>
                                ))}
                            </div>
                        ) : <EmptyState label="No medicine requests." />}
                    </SectionCard>

                    {/* Health Survey */}
                    <SectionCard icon={ClipboardDocumentListIcon} title="Health Survey Answers" count={surveyAnswers.length}>
                        {surveyAnswers.length ? (
                            <div className="divide-y divide-gray-100">
                                {surveyAnswers.map(s => (
                                    <div key={s.id} className="px-4 sm:px-6 py-3">
                                        <p className="text-sm font-medium text-gray-900 break-words">{s.question?.question}</p>
                                        <p className="text-sm text-gray-500 mt-1 break-words">
                                            {Array.isArray(s.answer) ? s.answer.join(', ') : String(s.answer ?? '—')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : <EmptyState label="No survey answers submitted." />}
                    </SectionCard>

                    {/* Requirements */}
                    <SectionCard icon={DocumentTextIcon} title="Submitted Requirements" count={requirements.length}>
                        {requirements.length ? (
                            <div className="divide-y divide-gray-100">
                                {requirements.map(r => (
                                    <div key={r.id} className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 break-words">{r.requirement_type?.name}</p>
                                            <p className="text-xs text-gray-400 break-words">{r.original_filename || 'No file'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={r.approval_status || r.verification_status} />
                                            {r.file_path && (
                                                <a href={route('admin.requirements.file', r.id)} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs text-clinic-600 hover:underline whitespace-nowrap print-hide">View</a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <EmptyState label="No requirements submitted." />}
                    </SectionCard>
                </div>
            </div>

            <PhotoLightbox
                photoUrl={photoOpen ? u?.profile_photo_url : null}
                name={u?.name}
                onClose={() => setPhotoOpen(false)}
            />
        </AdminLayout>
    );
}
