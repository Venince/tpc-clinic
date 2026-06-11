import { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import NotificationBell from '@/Components/Common/NotificationBell';
import {
    HomeIcon, CalendarIcon, BeakerIcon, ClipboardDocumentListIcon,
    DocumentTextIcon, ChatBubbleLeftRightIcon, UserCircleIcon,
    ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon, GlobeAltIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import LogoutConfirmModal from '@/Components/Common/LogoutConfirmModal';

const nav = [
    { name: 'Dashboard',    href: 'faculty.dashboard',          icon: HomeIcon },
    { name: 'Appointments', href: 'faculty.appointments.index', icon: CalendarIcon },
    { name: 'Medicine',     href: 'faculty.medicine.index',     icon: BeakerIcon },
    { name: 'Health Survey',href: 'faculty.survey.index',       icon: ClipboardDocumentListIcon },
    { name: 'Requirements', href: 'faculty.requirements.index', icon: DocumentTextIcon },
    { name: 'Messages',     href: 'faculty.messages.index',     icon: ChatBubbleLeftRightIcon },
    { name: 'Profile',      href: 'faculty.profile',            icon: UserCircleIcon },
];

export default function FacultyLayout({ children, title }) {
    const { auth, flash } = usePage().props;
    const [open, setOpen] = useState(false);
    const [showLogout, setShowLogout] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
                <img src="/images/tpc-logo.png" alt="TPC Logo" className="w-9 h-9 object-contain rounded-full flex-shrink-0" />
                <div>
                    <p className="font-semibold text-gray-900 text-sm">TPC Clinic</p>
                    <p className="text-xs text-gray-500">Faculty Portal</p>
                </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {nav.map(item => (
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
            <div className="border-t border-gray-100 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-clinic-100 rounded-full flex items-center justify-center">
                        <span className="text-clinic-700 font-semibold text-xs">{auth.user?.name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{auth.user?.name}</p>
                        <p className="text-xs text-gray-500">Faculty / Staff</p>
                    </div>
                    <button onClick={() => setShowLogout(true)} className="text-gray-400 hover:text-red-500 transition-colors">
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
                        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-500"><XMarkIcon className="w-6 h-6" /></button>
                        <SidebarContent />
                    </aside>
                </div>
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setOpen(true)} className="lg:hidden text-gray-500"><Bars3Icon className="w-6 h-6" /></button>
                        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                    </div>
                    <NotificationBell notificationsRoute="faculty.notifications" role="faculty_staff" />
                </header>
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
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
