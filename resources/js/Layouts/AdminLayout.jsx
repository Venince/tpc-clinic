import { Link, usePage } from '@inertiajs/react';
import NotificationBell from '@/Components/Common/NotificationBell';
import PushNotificationPrompt from '@/Components/Common/PushNotificationPrompt';
import UserAvatar from '@/Components/Common/UserAvatar';
import {
    HomeIcon, UsersIcon, CalendarIcon, BeakerIcon, ClipboardDocumentListIcon,
    DocumentChartBarIcon, MegaphoneIcon, ChatBubbleLeftRightIcon,
    AcademicCapIcon, DocumentTextIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon,
    IdentificationIcon, UserCircleIcon, GlobeAltIcon, ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useState, useEffect, useRef } from 'react';
import LogoutConfirmModal from '@/Components/Common/LogoutConfirmModal';

const navigation = [
    { name: 'Dashboard',         href: 'admin.dashboard',          icon: HomeIcon },
    { name: 'Users',             href: 'admin.users.index',        icon: UsersIcon },
    { name: 'Programs',          href: 'admin.programs.index',     icon: AcademicCapIcon },
    { name: 'Faculty & Staff',   href: 'admin.faculty.index',      icon: IdentificationIcon },
    { name: 'Appointments',      href: 'admin.appointments.index', icon: CalendarIcon },
    { name: 'Walk-in Log',       href: 'admin.walkin.index',       icon: ClipboardDocumentCheckIcon },
    { name: 'Medicine',          href: 'admin.medicine.index',     icon: BeakerIcon },
    { name: 'Medicine Requests', href: 'admin.medicine.requests',  icon: BeakerIcon },
    { name: 'Survey',            href: 'admin.survey.index',       icon: ClipboardDocumentListIcon },
    { name: 'Requirements',      href: 'admin.requirements.index', icon: DocumentTextIcon },
    { name: 'Announcements',     href: 'admin.announcements.index',icon: MegaphoneIcon },
    { name: 'Messages',          href: 'admin.messages.index',     icon: ChatBubbleLeftRightIcon },
    { name: 'Reports',           href: 'admin.reports.index',      icon: DocumentChartBarIcon },
    { name: 'Profile',           href: 'admin.profile',            icon: UserCircleIcon },
];

function SidebarContent({ auth, onLogout }) {
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
                    <p className="text-xs text-gray-500">Management System</p>
                </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navigation.map((item) => (
                    <Link key={item.name} href={route(item.href)}
                        className={clsx('sidebar-link', { active: route().current(item.href) })}>
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {item.name}
                    </Link>
                ))}
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
                        <Link
                            href={route(auth.user?.has_student_profile ? 'student.dashboard' : 'faculty.dashboard')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <UserCircleIcon className="w-4 h-4" /> Personal Account
                        </Link>
                        <button
                            onClick={() => { setUserMenuOpen(false); onLogout(); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
                        </button>
                    </div>
                )}
                <button onClick={() => setUserMenuOpen(o => !o)} className="flex items-center gap-3 w-full text-left">
                    <UserAvatar user={auth.user} size="sm" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{auth.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{auth.user?.role?.display_name}</p>
                    </div>
                </button>
            </div>
        </div>
    );
}

export default function AdminLayout({ children, title }) {
    const { auth, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { url } = usePage();

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const [showLogout, setShowLogout] = useState(false);
    const logout = () => router.post(route('logout'));

    return (
        <div className="min-h-screen-safe bg-gray-50 lg:flex">
            {/* Desktop sidebar — sticky, scrolls independently of the page */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:sticky lg:top-0 bg-white border-r border-gray-200 flex-shrink-0">
                <SidebarContent auth={auth} onLogout={() => setShowLogout(true)} />
            </aside>

            {/* Mobile sidebar */}
            <div className={clsx(
                'fixed inset-0 z-40 lg:hidden transition-opacity duration-300',
                sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}>
                <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
                <aside className={clsx(
                    'fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}>
                    <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                    <SidebarContent auth={auth} onLogout={() => setShowLogout(true)} />
                </aside>
            </div>

            {/* Main */}
            <div className="flex flex-col min-h-screen-safe lg:flex-1 min-w-0">
                <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                    </div>
                    <NotificationBell notificationsRoute="admin.notifications" role={auth.user?.role?.name} userId={auth.user?.id} />
                </header>

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
                    onConfirm={logout}
                    onCancel={() => setShowLogout(false)}
                />
            )}
        </div>
    );
}