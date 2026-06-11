import { useForm, Head, Link, usePage } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { EnvelopeIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function Login({ status, lockout_seconds = 0 }) {
    const { errors = {} } = usePage().props;
    const { data, setData, post, processing } = useForm({
        email: '', password: '', remember: false,
    });

    const [lockoutSeconds, setLockoutSeconds] = useState(lockout_seconds);

    useEffect(() => {
        if (lockout_seconds <= 0) return;
        setLockoutSeconds(lockout_seconds);
        const t = setInterval(() => {
            setLockoutSeconds(s => {
                if (s <= 1) { clearInterval(t); return 0; }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [lockout_seconds]);

    const fmt = (s) => {
        const m = Math.floor(s / 60), sec = s % 60;
        return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${s}s`;
    };

    const isLockedOut = lockoutSeconds > 0;

    const submit = (e) => {
        e.preventDefault();
        if (isLockedOut) return;
        post(route('login.store'));
    };

    return (
        <GuestLayout>
            <Head title="Login" />
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to your clinic account</p>

            {status && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {status}
                </div>
            )}

            {/* Lockout banner */}
            {isLockedOut && (
                <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg flex gap-3 items-start">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-700 font-medium text-sm">Account temporarily locked</p>
                        <p className="text-red-600 text-sm mt-0.5">
                            Too many failed attempts. Try again in{' '}
                            <span className="font-bold tabular-nums">{fmt(lockoutSeconds)}</span>.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="label">Email address</label>
                    <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className={`input pl-9 ${errors.email ? 'input-error' : ''}`}
                            placeholder="you@tpc.edu.ph"
                            autoFocus
                            disabled={isLockedOut}
                        />
                    </div>
                    {errors.email && (
                        <p className="error-msg">{errors.email}</p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">Password</label>
                        <Link href={route('password.request')} className="text-xs text-clinic-600 hover:text-clinic-700 transition-colors">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            className={`input pl-9 ${errors.password ? 'input-error' : ''}`}
                            placeholder="••••••••"
                            disabled={isLockedOut}
                        />
                    </div>
                    {errors.password && <p className="error-msg">{errors.password}</p>}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox" id="remember"
                        checked={data.remember}
                        onChange={e => setData('remember', e.target.checked)}
                        className="rounded border-gray-300 text-clinic-600 focus:ring-clinic-500"
                        disabled={isLockedOut}
                    />
                    <label htmlFor="remember" className="text-sm text-gray-600">Remember me</label>
                </div>

                <button
                    type="submit"
                    disabled={processing || isLockedOut}
                    className="btn-primary w-full btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLockedOut
                        ? `Locked — ${fmt(lockoutSeconds)}`
                        : processing ? 'Signing in…' : 'Sign in'}
                </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
                Contact the clinic admin if you need access.
            </p>
            <p className="text-center mt-3">
                <Link href={route('home')} className="text-xs text-clinic-600 hover:text-clinic-700 transition-colors">
                    ← Back to Home
                </Link>
            </p>
        </GuestLayout>
    );
}