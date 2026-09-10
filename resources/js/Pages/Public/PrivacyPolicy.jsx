import { Head, Link } from '@inertiajs/react';
import { ShieldCheckIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

const SECTIONS = [
    {
        title: '1. Information We Collect',
        body: [
            'We collect information necessary to provide clinical and health-monitoring services to students, faculty, and staff of Talibon Polytechnic College, including:',
        ],
        list: [
            'Account information — name, email address, and role.',
            'Academic information — program, year level, and block (for students) or department and position (for faculty/staff).',
            'Health information — sex, birth date, civil status, contact details, address, pregnancy status and due date, and medical notes recorded by clinic staff.',
            'Guardian information — for student accounts, guardian name and contact number.',
            'Appointment and visit records — clinic appointment bookings, walk-in logs, and medicine requests.',
            'Uploaded documents — health requirements such as medical certificates, drug test results, or vaccination cards.',
            'Health survey responses submitted through the system.',
            'Messages exchanged with clinic staff through the platform.',
            'Technical information — login timestamps, IP address, and device/browser information, collected automatically for security and audit purposes.',
        ],
    },
    {
        title: '2. How We Use Your Information',
        list: [
            'To schedule, manage, and record clinic appointments and walk-in visits.',
            'To process medicine requests and maintain inventory accountability.',
            'To monitor and respond to health conditions requiring special attention, such as pregnancy.',
            'To verify submitted health requirements.',
            'To send appointment status updates, announcements, and other clinic notifications.',
            'To generate aggregated statistical and administrative reports (e.g. headcounts, health trends) for the college administration.',
            'To maintain audit logs for accountability, troubleshooting, and security purposes.',
        ],
    },
    {
        title: '3. Who Can Access Your Information',
        body: [
            'Access to personal and health information is restricted by role:',
        ],
        list: [
            'Clinic administrators and super administrators can view records needed to provide care and manage clinic operations.',
            'Faculty and staff can view only their own health and appointment records.',
            'Students can view only their own health and appointment records.',
            'System access and changes to sensitive records are logged in an internal audit trail accessible only to authorized administrators.',
        ],
        footer: 'We do not sell, rent, or share your personal information with third parties for marketing purposes.',
    },
    {
        title: '4. Data Storage and Security',
        list: [
            'Data is stored on secured servers with access restricted to authorized personnel only.',
            'Passwords are encrypted and never stored or displayed in plain text.',
            'Uploaded documents and health records are accessible only to users with the appropriate role-based permissions.',
            'We take reasonable technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction.',
        ],
    },
    {
        title: '5. Data Retention',
        body: [
            'Health and appointment records are retained for as long as your account remains active with the institution, and for a reasonable period afterward as required for medical record-keeping, audit, and compliance purposes. Past appointment and visit records are kept for record-keeping even after an account becomes inactive.',
        ],
    },
    {
        title: '6. Your Rights',
        body: [
            'Under the Data Privacy Act of 2012 (Republic Act No. 10173), you have the right to:',
        ],
        list: [
            'Be informed that your personal data is being collected and processed.',
            'Access your personal data held by the clinic.',
            'Request correction of inaccurate or outdated personal data.',
            'Object to the processing of your data, subject to legal and institutional requirements.',
            'File a complaint with the National Privacy Commission if you believe your data has been misused.',
        ],
        footer: 'To exercise any of these rights, please contact the clinic directly using the details below.',
    },
    {
        title: '7. Accounts and Access',
        body: [
            'All accounts on this system are created by clinic administrators. If you believe your account or personal information has been compromised, please notify the clinic immediately so appropriate action can be taken.',
        ],
    },
    {
        title: '8. Changes to This Policy',
        body: [
            'This privacy policy may be updated from time to time to reflect changes in our practices or legal requirements. Continued use of the system after changes are posted constitutes acceptance of the revised policy.',
        ],
    },
];

export default function PrivacyPolicy() {
    return (
        <>
            <Head title="Privacy Policy — TPC e-Clinic" />
            <div className="min-h-screen bg-white font-sans">

                {/* ── Nav ── */}
                <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 md:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-8">
                        <Link href={route('home')} className="flex items-center gap-2.5">
                            <img src="/images/tpc-logo.png" alt="TPC" className="w-8 h-8 object-contain" />
                            <span className="font-semibold text-gray-900 text-sm">TPC e-Clinic</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-6">
                            <Link href={route('home')}
                                className="text-sm text-gray-500 hover:text-clinic-600 transition-colors">
                                Home
                            </Link>
                            <Link href={route('announcements')}
                                className="text-sm text-gray-500 hover:text-clinic-600 transition-colors">
                                Announcements
                            </Link>
                            <Link href={route('privacy-policy')}
                                className="text-sm text-clinic-600 font-medium">
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('announcements')}
                            className="md:hidden p-2 text-gray-500 hover:text-clinic-600 transition-colors"
                            title="Announcements">
                            <MegaphoneIcon className="w-5 h-5" />
                        </Link>
                        <Link href={route('login')}
                            className="bg-clinic-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-clinic-700 transition-colors">
                            Sign in
                        </Link>
                    </div>
                </nav>

                {/* ── Content ── */}
                <div className="page-fade">
                    <div className="max-w-3xl mx-auto px-6 py-10 md:py-14">
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldCheckIcon className="w-7 h-7 text-clinic-600" />
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Privacy Policy</h1>
                        </div>
                        <p className="text-sm text-gray-400 mb-10">Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                        <p className="text-gray-600 leading-relaxed mb-10">
                            Talibon Polytechnic College (TPC) e-Clinic ("the Clinic," "we," "us") is committed to protecting the
                            privacy of students, faculty, and staff who use this system. This policy explains what personal
                            and health information we collect, how it is used, and how it is protected, in accordance with
                            the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines.
                        </p>

                        <div className="space-y-10">
                            {SECTIONS.map(section => (
                                <section key={section.title}>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>
                                    {section.body?.map((p, i) => (
                                        <p key={i} className="text-gray-600 leading-relaxed mb-3">{p}</p>
                                    ))}
                                    {section.list && (
                                        <ul className="space-y-2 mb-3">
                                            {section.list.map((item, i) => (
                                                <li key={i} className="flex gap-2.5 text-gray-600 leading-relaxed">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-clinic-400 mt-2 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {section.footer && (
                                        <p className="text-gray-600 leading-relaxed">{section.footer}</p>
                                    )}
                                </section>
                            ))}

                            <section className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact Us</h2>
                                <p className="text-gray-600 leading-relaxed mb-3">
                                    For questions, concerns, or requests regarding this privacy policy or your personal data, please contact:
                                </p>
                                <p className="text-sm text-gray-700">TPC Clinic — Talibon Polytechnic College</p>
                                <p className="text-sm text-gray-500">San Isidro, Talibon, Bohol</p>
                                <p className="text-sm text-gray-500">(038) 000-0000 · tpc.eclinic@gmail.com</p>
                            </section>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <footer className="bg-clinic-900 text-white px-4 md:px-10 py-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="text-xs text-clinic-300">© {new Date().getFullYear()} Talibon Polytechnic College e-Clinic. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <Link href={route('home')} className="text-xs text-clinic-200 hover:text-white transition-colors">Home</Link>
                            <Link href={route('announcements')} className="text-xs text-clinic-200 hover:text-white transition-colors">Announcements</Link>
                            <Link href={route('privacy-policy')} className="text-xs text-white">Privacy Policy</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}