import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const LINKS = [
    { key: 'home',          label: 'Home',          type: 'home' },
    { key: 'services',      label: 'Services',      type: 'section', hash: '#services' },
    { key: 'about',         label: 'About',         type: 'section', hash: '#about' },
    { key: 'announcements', label: 'Announcements', type: 'page',    routeName: 'announcements' },
];

// Sections on the Home page that drive the "active" link while scrolling.
const SPY_SECTIONS = [
    ['services',              'services'],
    ['announcements-preview', 'announcements'],
    ['about',                 'about'],
];

function dashboardRoute(user) {
    switch (user?.role?.name) {
        case 'admin':
        case 'super_admin':   return 'admin.dashboard';
        case 'student':       return 'student.dashboard';
        case 'faculty_staff': return 'faculty.dashboard';
        default:              return null;
    }
}

/**
 * Shared navigation for the public pages (Home, Announcements).
 * Desktop: inline links with an animated underline. Mobile: animated hamburger menu
 * with a dimmed backdrop and staggered links. Motion is disabled for users who
 * prefer reduced motion.
 */
export default function PublicNav() {
    const { auth } = usePage().props;
    const isHome          = route().current('home');
    const isAnnouncements = route().current('announcements');

    const [open, setOpen]         = useState(false);
    const [spy, setSpy]           = useState('home');
    const [scrolled, setScrolled] = useState(false);
    const navRef = useRef(null);

    // Soft shadow once the page is scrolled (all public pages).
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Highlight the section currently in view (Home page only).
    useEffect(() => {
        if (!isHome) return;
        const onScroll = () => {
            let current = 'home';
            for (const [id, key] of SPY_SECTIONS) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= 140) current = key;
            }
            setSpy(current);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isHome]);

    // Mobile menu: close on outside click / Escape / growing past the mobile breakpoint,
    // and keep the page behind it from scrolling while it's open.
    useEffect(() => {
        if (!open) return;

        const onDown = (e) => { if (navRef.current && !navRef.current.contains(e.target)) setOpen(false); };
        const onKey  = (e) => { if (e.key === 'Escape') setOpen(false); };
        const mq     = window.matchMedia('(min-width: 768px)');
        const onMq   = (e) => { if (e.matches) setOpen(false); };

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        mq.addEventListener('change', onMq);

        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
            mq.removeEventListener('change', onMq);
        };
    }, [open]);

    const active = isHome ? spy : isAnnouncements ? 'announcements' : null;

    const goToSection = (hash) => {
        if (isHome) {
            document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        router.visit(route('home'), {
            onSuccess: () => setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 100),
        });
    };

    const onLinkClick = (e, link) => {
        setOpen(false);
        if (link.type === 'section') {
            e.preventDefault();
            goToSection(link.hash);
        } else if (link.type === 'home' && isHome) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const renderLink = (link, className, style) => {
        const common = {
            className,
            style,
            onClick: (e) => onLinkClick(e, link),
            'aria-current': active === link.key ? 'page' : undefined,
        };

        if (link.type === 'section') {
            return <a key={link.key} href={`${route('home')}${link.hash}`} {...common}>{link.label}</a>;
        }
        return (
            <Link key={link.key} href={route(link.type === 'home' ? 'home' : link.routeName)} {...common}>
                {link.label}
            </Link>
        );
    };

    // Desktop: underline grows from the left on hover / when active.
    const desktopClass = (key) => clsx(
        'relative text-sm font-medium py-1 transition-colors motion-reduce:transition-none',
        'after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-full after:rounded-full after:bg-clinic-600',
        'after:origin-left after:transition-transform after:duration-300 motion-reduce:after:transition-none',
        active === key
            ? 'text-clinic-600 after:scale-x-100'
            : 'text-gray-500 hover:text-clinic-600 after:scale-x-0 hover:after:scale-x-100'
    );

    // Mobile: 48px-tall rows, each fades/slides in with a small stagger.
    const mobileClass = (key) => clsx(
        'flex items-center min-h-[48px] px-4 rounded-xl text-[15px] font-medium',
        'transition-all duration-300 ease-out motion-reduce:transition-none',
        'active:bg-gray-100',
        open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
        active === key ? 'bg-green-50 text-clinic-700' : 'text-gray-700 hover:bg-gray-50'
    );
    const stagger = (i) => ({ transitionDelay: open ? `${70 + i * 45}ms` : '0ms' });

    const dash     = dashboardRoute(auth?.user);
    const ctaHref  = dash ? route(dash) : route('login');
    const ctaLabel = dash ? 'Dashboard' : 'Sign in';
    const CtaIcon  = dash ? Squares2X2Icon : ArrowRightOnRectangleIcon;

    return (
        <>
            {/* Dimmed backdrop behind the mobile menu */}
            <div
                aria-hidden="true"
                onClick={() => setOpen(false)}
                className={clsx(
                    'md:hidden fixed inset-0 z-30 bg-black/30 transition-opacity duration-300 motion-reduce:transition-none',
                    open ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
            />

            <nav
                ref={navRef}
                className={clsx(
                    'sticky top-0 z-40 bg-white border-b border-gray-100 transition-shadow duration-300 motion-reduce:transition-none',
                    scrolled && 'shadow-sm'
                )}
            >
                <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 md:gap-8 min-w-0">
                        <Link href={route('home')} className="flex items-center gap-2.5 min-w-0" onClick={() => setOpen(false)}>
                            <img src="/images/tpc-logo.png" alt="TPC" className="w-8 h-8 object-contain flex-shrink-0" />
                            <span className="font-semibold text-gray-900 text-sm truncate">TPC e-Clinic</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-6">
                            {LINKS.map(link => renderLink(link, desktopClass(link.key)))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                            href={ctaHref}
                            className="hidden md:inline-flex bg-clinic-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-clinic-700 hover:shadow-md active:scale-95 transition-all duration-200 whitespace-nowrap motion-reduce:transition-none"
                        >
                            {ctaLabel}
                        </Link>

                        {/* Hamburger ⇄ close: the two icons cross-fade and rotate */}
                        <button
                            type="button"
                            onClick={() => setOpen(o => !o)}
                            aria-expanded={open}
                            aria-controls="public-mobile-menu"
                            aria-label={open ? 'Close menu' : 'Open menu'}
                            className="md:hidden relative w-11 h-11 -mr-1 rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        >
                            <Bars3Icon className={clsx(
                                'absolute inset-0 m-auto w-6 h-6 transition-all duration-300 motion-reduce:transition-none',
                                open ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                            )} />
                            <XMarkIcon className={clsx(
                                'absolute inset-0 m-auto w-6 h-6 transition-all duration-300 motion-reduce:transition-none',
                                open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                            )} />
                        </button>
                    </div>
                </div>

                {/* Mobile menu panel: slides down + fades; stays mounted so it can animate out too */}
                <div
                    id="public-mobile-menu"
                    className={clsx(
                        'md:hidden absolute top-full inset-x-0 bg-white border-b border-gray-100 shadow-lg',
                        'max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain',
                        'transition-all duration-300 ease-out motion-reduce:transition-none',
                        open ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-3 invisible pointer-events-none'
                    )}
                >
                    <div className="px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        {LINKS.map((link, i) => renderLink(link, mobileClass(link.key), stagger(i)))}

                        <div className="mt-2 pt-2.5 border-t border-gray-100">
                            <Link
                                href={ctaHref}
                                onClick={() => setOpen(false)}
                                style={stagger(LINKS.length)}
                                className={clsx(
                                    'flex items-center justify-center gap-1.5 w-full min-h-[44px] rounded-lg',
                                    'bg-clinic-600 text-white text-sm font-medium',
                                    'hover:bg-clinic-700 active:scale-[0.98] active:bg-clinic-700',
                                    'transition-all duration-300 ease-out motion-reduce:transition-none',
                                    open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                                )}
                            >
                                <CtaIcon className="w-4 h-4" />
                                {ctaLabel}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}
