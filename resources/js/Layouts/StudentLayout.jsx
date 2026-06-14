import { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import NotificationBell from '@/Components/Common/NotificationBell';
import {
    HomeIcon, CalendarIcon, BeakerIcon, ClipboardDocumentListIcon,
    DocumentTextIcon, ChatBubbleLeftRightIcon, UserCircleIcon,
    ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon, GlobeAltIcon,
    CheckCircleIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import LogoutConfirmModal from '@/Components/Common/LogoutConfirmModal';

const nav = [
    { name: 'Dashboard',     href: 'student.dashboard',          icon: HomeIcon },
    { name: 'Appointments',  href: 'student.appointments.index', icon: CalendarIcon },
    { name: 'Medicine',      href: 'student.medicine.index',     icon: BeakerIcon },
    { name: 'Health Survey', href: 'student.survey.index',       icon: ClipboardDocumentListIcon },
    { name: 'Requirements',  href: 'student.requirements.index', icon: DocumentTextIcon },
    { name: 'Messages',      href: 'student.messages.index',     icon: ChatBubbleLeftRightIcon },
    { name: 'Profile',       href: 'student.profile',            icon: UserCircleIcon },
];

// These are never locked regardless of onboarding state
const ALWAYS_ACCESSIBLE = new Set([
    'student.profile',
    'student.survey.index',
    'student.requirements.index',
    'student.notifications',
]);

function OnboardingBanner({ onboarding }) {
    if (!onboarding || onboarding.done) return null;

    const steps = [
        {
            label: 'Complete Profile',
            done: onboarding.profile_completed,
            href: route('student.profile'),
        },
        {
            label: 'Health Survey',
            done: onboarding.survey_completed,
            href: route('student.survey.index'),
        },
        {
            label: 'Upload Requirements',
            done: onboarding.requirements_completed,
            href: route('student.requirements.index'),
        },
    ];

    // Any incomplete step is actionable — student picks their own order
    const nextStep = steps.find(s => !s.done);

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-amber-800">
                    Complete your setup to access all features
                </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                        {i > 0 && (
                            <div className={clsx(
                                'h-px w-5 flex-shrink-0',
                                steps[i - 1].done ? 'bg-green-400' : 'bg-amber-200'
                            )} />
                        )}
                        {step.done ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-800 bg-green-100 border border-green-300 rounded-full px-2.5 py-1">
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                {step.label}
                            </span>
                        ) : (
                            <Link
                                href={step.href}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-400 rounded-full px-2.5 py-1 transition-colors"
                            >
                                <span className="w-3 h-3 rounded-full border-2 border-amber-500 flex-shrink-0" />
                                {step.label}
                            </Link>
                        )}
                    </div>
                ))}
                {nextStep && (
                    <p className="ml-auto text-xs text-amber-700 hidden sm:block">
                        Next:{' '}
                        <Link href={nextStep.href} className="font-semibold underline underline-offset-2 hover:text-amber-900">
                            {nextStep.label}
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}

export default function StudentLayout({ children, title }) {
    const { auth, flash, onboarding } = usePage().props;
    const { url } = usePage();
    const [open, setOpen] = useState(false);
    const [showLogout, setShowLogout] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const isLocked = (href) =>
        onboarding && !onboarding.done && !ALWAYS_ACCESSIBLE.has(href);

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
                <img src="/images/tpc-logo.png" alt="TPC Logo" className="w-9 h-9 object-contain rounded-full flex-shrink-0" />
                <div>
                    <p className="font-semibold text-gray-900 text-sm">TPC e-Clinic</p>
                    <p className="text-xs text-gray-500">Student Portal</p>
                </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {nav.map(item => {
                    const locked = isLocked(item.href);
                    if (locked) {
                        return (
                            <div key={item.name}
                                title="Finish setup to unlock this section"
                                className="sidebar-link opacity-40 cursor-not-allowed select-none">
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span className="flex-1">{item.name}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-medium">
                                    Locked
                                </span>
                            </div>
                        );
                    }
                    return (
                        <Link key={item.name} href={route(item.href)}
                            className={clsx('sidebar-link', { active: route().current(item.href) })}>
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {item.name}
                        </Link>
                    );
                })}
                <div className="pt-2 mt-2 border-t border-gray-100">
                    <Link href={route('home')}
                        className={clsx('sidebar-link', { active: route().current('home') })}>
                        <GlobeAltIcon className="w-5 h-5 flex-shrink-0" />
                        Public Home
                    </Link>
                </div>
            </nav>
            <div className="border-t border-gray-100 p-4">
                <div className="flex items-center gap-3">
                    {auth.user?.profile_photo_url ? (
                        <img src={auth.user.profile_photo_url} alt={auth.user.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-8 h-8 bg-clinic-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-clinic-700 font-semibold text-xs">{auth.user?.name?.charAt(0)}</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{auth.user?.name}</p>
                        <p className="text-xs text-gray-500">Student</p>
                    </div>
                    <button onClick={() => setShowLogout(true)}
                        className="text-gray-400 hover:text-red-500 transition-colors">
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 flex-shrink-0">
                <SidebarContent />
            </aside>
            {open && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50">
                        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-500">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setOpen(true)} className="lg:hidden text-gray-500">
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                    </div>
                    <NotificationBell notificationsRoute="student.notifications" role="student" />
                </header>

                <OnboardingBanner onboarding={onboarding} />

                <main className="flex-1 overflow-y-auto p-6">
                    <div key={url} className="page-fade">{children}</div>
                </main>
            </div>
            {showLogout && (
                <LogoutConfirmModal
                    onConfirm={() => router.post(route('logout'))}
                    onCancel={() => setShowLogout(false)}
                />
            )}
        </div>
    );
}