import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    PlusIcon, PencilIcon, TrashIcon, XMarkIcon,
    CalendarDaysIcon, PhoneIcon, MapPinIcon,
    ClockIcon, EnvelopeIcon, MegaphoneIcon,
} from '@heroicons/react/24/outline';

const tagStyles = {
    available: 'bg-green-50 text-green-700 border border-green-200',
    urgent:    'bg-red-50 text-red-700 border border-red-200',
    info:      'bg-blue-50 text-blue-700 border border-blue-200',
};

export default function Home({ announcements, services, auth, facilityPhoto }) {
    const isAdmin = auth?.user?.role?.name === 'admin' || auth?.user?.role?.name === 'super_admin';
    const [modal, setModal] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        title: '', description: '', icon: 'stethoscope',
        tag: 'Available', tag_type: 'available', is_active: true,
    });

    const openNew = () => { reset(); setModal('new'); };
    const openEdit = (s) => {
        setData({ title: s.title, description: s.description, icon: s.icon, tag: s.tag, tag_type: s.tag_type, is_active: s.is_active });
        setModal(s);
    };
    const submit = (e) => {
        e.preventDefault();
        if (modal === 'new') {
            post(route('admin.services.store'), { onSuccess: () => { setModal(null); reset(); } });
        } else {
            put(route('admin.services.update', modal.id), { onSuccess: () => { setModal(null); reset(); } });
        }
    };
    const catColor = (c) => ({
        general: 'bg-green-50 text-green-700',
        health:  'bg-blue-50 text-blue-700',
        event:   'bg-purple-50 text-purple-700',
    })[c] || 'bg-gray-100 text-gray-600';

    return (
        <>
            <Head title="TPC e-Clinic — Talibon Polytechnic College" />
            <div className="min-h-screen bg-white font-sans">

                {/* ── Nav ── */}
                <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 md:px-8 py-3 flex items-center justify-between animate-slide-up" style={{ animationDelay: '0ms' }}>
                    <div className="flex items-center gap-4 md:gap-8">
                        <Link href={route('home')} className="flex items-center gap-2.5">
                            <img src="/images/tpc-logo.png" alt="TPC" className="w-8 h-8 object-contain" />
                            <span className="font-semibold text-gray-900 text-sm">TPC e-Clinic</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-6">
                            {[
                                { label: 'Home',          href: route('home') },
                                { label: 'Services',      href: '#services' },
                                { label: 'About',         href: '#about' },
                                { label: 'Announcements', href: route('announcements') },
                            ].map(n => (
                                <a key={n.label} href={n.href} className="text-sm text-gray-500 hover:text-clinic-600 transition-colors">
                                    {n.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('login')} className="bg-clinic-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-clinic-700 transition-colors">
                            Sign in
                        </Link>
                    </div>
                </nav>

                {/* ── Hero ── */}
                <section className="grid grid-cols-1 md:grid-cols-2 items-center animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex flex-col justify-center px-6 md:px-12 py-10 md:py-16">
                        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 mb-5 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-clinic-500 animate-pulse"></span>
                            <span className="text-sm text-clinic-700 font-medium">Talibon Polytechnic College</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 md:mb-5">
                            Excellence in <span className="text-clinic-600">Clinical Care</span> for the TPC Community.
                        </h1>
                        <p className="text-gray-500 text-base leading-relaxed mb-6 md:mb-8 max-w-lg">
                            Empowering Talibon Polytechnic College through professional clinical services, health-risk assistance, and comprehensive health monitoring for every student and staff.
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Link href={route('login')} className="inline-flex items-center justify-center gap-2 bg-clinic-600 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-clinic-700 transition-colors">
                                <CalendarDaysIcon className="w-5 h-5" /> Book appointment
                            </Link>
                            <a href="tel:0380000000" className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors">
                                <PhoneIcon className="w-5 h-5" /> Emergency contact
                            </a>
                        </div>
                    </div>
                    <div className="relative">
                        {facilityPhoto ? (
                            <div className="relative w-full">
                                <img
                                    src={`/storage/${facilityPhoto}`}
                                    alt="TPC e-Clinic facility"
                                    className="w-full max-h-[480px] object-contain"
                                />
                                {isAdmin && (
                                    <label className="absolute bottom-3 right-3 cursor-pointer inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white shadow-sm transition-colors">
                                        <PencilIcon className="w-3.5 h-3.5" />
                                        Change photo
                                        <input type="file" accept="image/*" className="hidden"
                                            onChange={e => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                const form = new FormData();
                                                form.append('photo', file);
                                                form.append('_token', document.querySelector('meta[name=csrf-token]')?.content ?? '');
                                                router.post(route('admin.settings.facility-photo'), form, { forceFormData: true });
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center min-h-[280px] md:min-h-[420px] bg-gray-50">
                                <div className="text-center text-gray-300">
                                    <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-400">Clinic facility photo</p>
                                </div>
                                {isAdmin && (
                                    <label className="absolute bottom-3 right-3 cursor-pointer inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white shadow-sm transition-colors">
                                        <PencilIcon className="w-3.5 h-3.5" />
                                        Upload photo
                                        <input type="file" accept="image/*" className="hidden"
                                            onChange={e => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                const form = new FormData();
                                                form.append('photo', file);
                                                form.append('_token', document.querySelector('meta[name=csrf-token]')?.content ?? '');
                                                router.post(route('admin.settings.facility-photo'), form, { forceFormData: true });
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Services ── */}
                <section id="services" className="bg-gray-50 px-4 md:px-10 py-10 md:py-14 animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-xs font-semibold text-clinic-600 uppercase tracking-widest mb-1">Clinical services</p>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Comprehensive medical support</h2>
                            <p className="text-sm text-gray-500 mt-1">Tailored for the TPC enrollment community</p>
                        </div>
                        {isAdmin && (
                            <button onClick={openNew} className="inline-flex items-center gap-1.5 bg-clinic-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-clinic-700 transition-colors">
                                <PlusIcon className="w-4 h-4" /> Add service
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {services.map(s => (
                            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tagStyles[s.tag_type] || tagStyles.available}`}>
                                        {s.tag}
                                    </span>
                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-clinic-600 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => { if (confirm('Delete this service?')) router.delete(route('admin.services.destroy', s.id)); }} className="text-gray-400 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-clinic-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{s.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                                </div>
                            </div>
                        ))}
                        {!services.length && (
                            <div className="col-span-3 text-center py-12 text-gray-400 text-sm">No services listed yet.</div>
                        )}
                    </div>
                </section>

                {/* ── Announcements ── */}
                <section className="px-4 md:px-10 py-10 md:py-14 animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-xs font-semibold text-clinic-600 uppercase tracking-widest mb-1">Clinic announcements</p>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Stay informed</h2>
                            <p className="text-sm text-gray-500 mt-1">Latest updates from the TPC e-Clinic</p>
                        </div>
                        <Link href={route('announcements')} className="text-sm text-clinic-600 hover:text-clinic-700 font-medium flex items-center gap-1 whitespace-nowrap">
                            View all <span>→</span>
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                        {announcements.map(a => (
                            <div key={a.id} className="flex gap-4 px-4 md:px-6 py-5 bg-white hover:bg-gray-50 transition-colors items-start">
                                <div className="flex-shrink-0 w-12 text-center bg-green-50 rounded-xl py-2 px-1">
                                    <p className="text-lg font-bold text-clinic-700 leading-none">{new Date(a.published_at).getDate()}</p>
                                    <p className="text-xs text-clinic-500 uppercase mt-0.5">{new Date(a.published_at).toLocaleString('default',{month:'short'})}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 ${catColor(a.category)}`}>{a.category}</span>
                                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{a.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{a.content}</p>
                                </div>
                            </div>
                        ))}
                        {!announcements.length && (
                            <div className="px-6 py-10 text-center text-gray-400 text-sm bg-white">No announcements at this time.</div>
                        )}
                    </div>
                </section>

                {/* ── Facilities ── */}
                <section id="about" className="bg-gray-50 px-4 md:px-10 py-10 md:py-14 animate-slide-up" style={{ animationDelay: '400ms' }}>
                    <p className="text-xs font-semibold text-clinic-600 uppercase tracking-widest mb-1">Visit our facilities</p>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8">Find us on campus</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            {[
                                { icon: MapPinIcon,   label: 'Address',       value: 'San Isidro, Talibon, Bohol' },
                                { icon: ClockIcon,    label: 'Clinic hours',  value: 'Mon – Fri: 8:00 AM – 5:00 PM\nSat: 8:00 AM – 12:00 PM' },
                                { icon: EnvelopeIcon, label: 'Contact us',    value: '(038) 000-0000 · tpcwebsite05@gmail.com' },
                            ].map(item => (
                                <div key={item.label} className="flex gap-4 items-start">
                                    <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <item.icon className="w-4 h-4 text-clinic-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 mb-0.5">{item.label}</p>
                                        <p className="text-sm text-gray-500 whitespace-pre-line">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-xl overflow-hidden border border-gray-200 min-h-[280px]">
                            <iframe
                                title="TPC Campus Map"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3927.563055105146!2d124.3202475758793!3d10.134806170698845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9f1442b17a629%3A0xdc25a9f343aa88fb!2sTalibon%20Polytechnic%20College!5e0!3m2!1sen!2sph!4v1781091273215!5m2!1sen!2sph"
                                width="100%"
                                height="280"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="bg-clinic-900 text-white px-4 md:px-10 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <img src="/images/tpc-logo.png" alt="TPC" className="w-7 h-7 object-contain" />
                                <span className="font-semibold text-sm">TPC e-Clinic</span>
                            </div>
                            <p className="text-xs text-clinic-200 leading-relaxed max-w-[200px]">Dedicated to the health and wellness of the TPC academic community.</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-clinic-300 uppercase tracking-widest mb-3">Quick links</p>
                            {['Home','Services','Announcements','Sign in'].map(l => (
                                <a key={l} href="#" className="block text-sm text-clinic-200 hover:text-white mb-2 transition-colors">{l}</a>
                            ))}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-clinic-300 uppercase tracking-widest mb-3">Contact</p>
                            {['(038) 000-0000','tpcwebsite05@gmail.com','San Isidro, Talibon, Bohol'].map(l => (
                                <p key={l} className="text-sm text-clinic-200 mb-2">{l}</p>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
                        <p className="text-xs text-clinic-300">© {new Date().getFullYear()} Talibon Polytechnic College e-Clinic. All rights reserved.</p>
                        <div className="flex items-center gap-2">
                            <a href="https://www.facebook.com/share/18XASdjQ8z/" target="_blank" rel="noopener noreferrer">
                                <img src="/images/self-logo-icon.png" alt="SecrIT Solutions Logo" className="h-4 w-auto opacity-60 hover:opacity-100 transition" />
                            </a>
                            <span className="text-white/30 text-xs">|</span>
                            <p className="text-xs text-white/60">SecrIT Solutions: AABJRSV</p>
                        </div>
                    </div>
                </footer>

            </div>

            {/* ── Service Modal (admin only) ── */}
            {modal !== null && isAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">{modal === 'new' ? 'Add service' : 'Edit service'}</h3>
                            <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className="label">Title</label>
                                <input value={data.title} onChange={e => setData('title', e.target.value)} className={`input ${errors.title ? 'input-error' : ''}`} placeholder="General Consultation" />
                                {errors.title && <p className="error-msg">{errors.title}</p>}
                            </div>
                            <div>
                                <label className="label">Description</label>
                                <textarea value={data.description} onChange={e => setData('description', e.target.value)} className={`input ${errors.description ? 'input-error' : ''}`} rows={3} placeholder="Brief description of the service…" />
                                {errors.description && <p className="error-msg">{errors.description}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Tag label</label>
                                    <input value={data.tag} onChange={e => setData('tag', e.target.value)} className="input" placeholder="Available" />
                                </div>
                                <div>
                                    <label className="label">Tag type</label>
                                    <select value={data.tag_type} onChange={e => setData('tag_type', e.target.value)} className="input">
                                        <option value="available">Available (green)</option>
                                        <option value="urgent">Urgent (red)</option>
                                        <option value="info">Info (blue)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="svc-active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded text-clinic-600" />
                                <label htmlFor="svc-active" className="text-sm text-gray-700">Active (visible on public page)</label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={processing} className="btn-primary">{processing ? 'Saving…' : 'Save'}</button>
                                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
