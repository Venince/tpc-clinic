import { Link, usePage } from '@inertiajs/react';
import NotificationBell from '@/Components/Common/NotificationBell';
import UserAvatar from '@/Components/Common/UserAvatar';
import {
    HomeIcon, UsersIcon, CalendarIcon, BeakerIcon, ClipboardDocumentListIcon,
    DocumentChartBarIcon, MegaphoneIcon, ChatBubbleLeftRightIcon,
    AcademicCapIcon, DocumentTextIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon,
    IdentificationIcon, UserCircleIcon, GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import LogoutConfirmModal from '@/Components/Common/LogoutConfirmModal';

const navigation = [
    { name: 'Dashboard',         href: 'admin.dashboard',          icon: HomeIcon },
    { name: 'Users',             href: 'admin.users.index',        icon: UsersIcon },
    { name: 'Programs',          href: 'admin.programs.index',     icon: AcademicCapIcon },
    { name: 'Faculty & Staff',   href: 'admin.faculty.index',      icon: IdentificationIcon },
    { name: 'Appointments',      href: 'admin.appointments.index', icon: CalendarIcon },
    { name: 'Medicine',          href: 'admin.medicine.index',     icon: BeakerIcon },
    { name: 'Medicine Requests', href: 'admin.medicine.requests',  icon: BeakerIcon },
    { name: 'Survey',            href: 'admin.survey.index',       icon: ClipboardDocumentListIcon },
    { name: 'Requirements',      href: 'admin.requirements.index', icon: DocumentTextIcon },
    { name: 'Announcements',     href: 'admin.announcements.index',icon: MegaphoneIcon },
    { name: 'Messages',          href: 'admin.messages.index',     icon: ChatBubbleLeftRightIcon },
    { name: 'Reports',           href: 'admin.reports.index',      icon: DocumentChartBarIcon },
    { name: 'Profile',           href: 'admin.profile',            icon: UserCircleIcon },
];

export default function AdminLayout({ children, title }) {
    const { auth, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const [showLogout, setShowLogout] = useState(false);
    const logout = () => router.post(route('logout'));

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
                <img src="/images/tpc-logo.png" alt="TPC Logo" className="w-9 h-9 object-contain rounded-full flex-shrink-0" />
                <div>
                    <p className="font-semibold text-gray-900 text-sm">TPC e-Clinic</p>
                    <p className="text-xs text-gray-500">Management System</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navigation.map((item) => (
                    <Link key={item.name} href={route(item.href)}
                        className={clsx('sidebar-link', { active: route().current(item.href) })}>
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {item.name}
                    </Link>
                ))}
                {/* Divider + Home */}
                <div className="pt-2 mt-2 border-t border-gray-100">
                    <Link href={route('home')}
                        className={clsx('sidebar-link', { active: route().current('home') })}>
                        <GlobeAltIcon className="w-5 h-5 flex-shrink-0" />
                        Public Home
                    </Link>
                </div>
            </nav>

            {/* User */}
            <div className="border-t border-gray-100 p-4">
                <div className="flex items-center gap-3">
                    <UserAvatar user={auth.user} size="sm" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{auth.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{auth.user?.role?.display_name}</p>
                    </div>
                    <button
                        onClick={() => setShowLogout(true)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 flex-shrink-0">
                <SidebarContent />
            </aside>

            {/* Mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
                    <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50">
                        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                    </div>
                    <NotificationBell notificationsRoute="admin.notifications" role={auth.user?.role?.name} />
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
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
