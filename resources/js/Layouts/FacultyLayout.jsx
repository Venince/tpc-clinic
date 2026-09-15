import { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import NotificationBell from '@/Components/Common/NotificationBell';
import PushNotificationPrompt from '@/Components/Common/PushNotificationPrompt';
import {
    HomeIcon, CalendarIcon, BeakerIcon, ClipboardDocumentListIcon,
    DocumentTextIcon, ChatBubbleLeftRightIcon, UserCircleIcon,
    ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon, Bars3Icon, XMarkIcon, GlobeAltIcon, ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import LogoutConfirmModal from '@/Components/Common/LogoutConfirmModal';

const nav = [
    { name: 'Dashboard',       href: 'faculty.dashboard',          icon: HomeIcon },
    { name: 'Appointments',    href: 'faculty.appointments.index', icon: CalendarIcon },
    { name: 'Walk-in History', href: 'faculty.walkin.index',       icon: ClipboardDocumentCheckIcon },
    { name: 'Medicine',        href: 'faculty.medicine.index',     icon: BeakerIcon },
    { name: 'Health Survey',   href: 'faculty.survey.index',       icon: ClipboardDocumentListIcon },
    { name: 'Requirements',    href: 'faculty.requirements.index', icon: DocumentTextIcon },
    { name: 'Messages',        href: 'faculty.messages.index',     icon: ChatBubbleLeftRightIcon },
    { name: 'Profile',         href: 'faculty.profile',            icon: UserCircleIcon },
];

// Only the profile (and notifications, which isn't in the nav) stays reachable
// until the profile is complete — everything else is locked.
const ALWAYS_ACCESSIBLE = new Set([
    'faculty.profile',
    'faculty.notifications',
]);

function OnboardingBanner({ facultyOnboarding }) {
    if (!facultyOnboarding || facultyOnboarding.done) return null;

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-semibold text-amber-800 flex-1 min-w-0">
                    Complete your profile to access all features.
                </p>
                <Link href={route('faculty.profile')}
                    className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-400 rounded-full px-2.5 py-1 transition-colors whitespace-nowrap">
                    Complete Profile
                </Link>
            </div>
        </div>
    );
}

function SidebarContent({ auth, isAdminUser, isLocked, onLogout }) {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const closeOnOutsideClick = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    return (
    <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
            <img src="/images/tpc-logo.png" alt="TPC Logo" className="w-9 h-9 object-contain rounded-full flex-shrink-0" />
            <div>
                <p className="font-semibold text-gray-900 text-sm">TPC e-Clinic</p>
                <p className="text-xs text-gray-500">{isAdminUser ? 'Personal Account' : 'Faculty Portal'}</p>
            </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {nav.map(item => {
                const locked = isLocked(item.href);
                if (locked) {
                    return (
                        <div key={item.name} title="Complete your profile to unlock this section"
                            className="sidebar-link opacity-40 cursor-not-allowed select-none">
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="flex-1">{item.name}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-medium">Locked</span>
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
                <Link href={route('home')} className={clsx('sidebar-link', { active: route().current('home') })}>
                    <GlobeAltIcon className="w-5 h-5 flex-shrink-0" />
                    Public Home
                </Link>
            </div>
        </nav>
        <div className="border-t border-gray-100 p-4 relative" ref={userMenuRef}>
            {userMenuOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                    {isAdminUser && (
                        <Link href={route('admin.dashboard')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Back to Admin Panel
                        </Link>
                    )}
                    <button
                        onClick={() => { setUserMenuOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
                    </button>
                </div>
            )}
            <button onClick={() => setUserMenuOpen(o => !o)} className="flex items-center gap-3 w-full text-left">
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
                    <p className="text-xs text-gray-500">{auth.user?.role?.display_name || 'Faculty / Staff'}</p>
                </div>
            </button>
        </div>
    </div>
    );
}

export default function FacultyLayout({ children, title }) {
    const { auth, flash, facultyOnboarding } = usePage().props;
    const { url } = usePage();
    const [open, setOpen] = useState(false);
    const [showLogout, setShowLogout] = useState(false);
    const isAdminUser = ['admin', 'super_admin'].includes(auth.user?.role?.name);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const isLocked = (href) => facultyOnboarding && !facultyOnboarding.done && !ALWAYS_ACCESSIBLE.has(href);

    return (
        <div className="min-h-screen-safe bg-gray-50 lg:flex">
            {/* Desktop sidebar — sticky, scrolls independently of the page */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:sticky lg:top-0 bg-white border-r border-gray-200 flex-shrink-0">
                <SidebarContent auth={auth} isAdminUser={isAdminUser} isLocked={isLocked} onLogout={() => setShowLogout(true)} />
            </aside>

            {/* Mobile sidebar */}
            <div className={clsx(
                'fixed inset-0 z-40 lg:hidden transition-opacity duration-300',
                open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}>
                <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
                <aside className={clsx(
                    'fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out',
                    open ? 'translate-x-0' : '-translate-x-full'
                )}>
                    <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-500">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                    <SidebarContent auth={auth} isAdminUser={isAdminUser} isLocked={isLocked} onLogout={() => setShowLogout(true)} />
                </aside>
            </div>

            <div className="flex flex-col min-h-screen-safe lg:flex-1 min-w-0">
                <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 flex-shrink-0 min-w-0">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <button onClick={() => setOpen(true)} className="lg:hidden text-gray-500 flex-shrink-0">
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h1>
                    </div>
                    <div className="flex-shrink-0">
                        <NotificationBell notificationsRoute="faculty.notifications" role="faculty_staff" userId={auth.user?.id} />
                    </div>
                </header>

                <OnboardingBanner facultyOnboarding={facultyOnboarding} />

                {/* p-4 on mobile, p-6 on sm+ */}
                <main className="flex-1 overflow-x-hidden p-4 sm:p-6 flex flex-col">
                    <div key={url} className="page-fade space-y-4 min-w-0 flex-1 flex flex-col min-h-0">
                        <PushNotificationPrompt />
                        {children}
                    </div>
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
