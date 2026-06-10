import { useForm, Head, Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '', password: '', remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login.store'));
    };

    return (
        <GuestLayout>
            <Head title="Login" />
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to your clinic account</p>

            {status && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{status}</div>}

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
                        />
                    </div>
                    {errors.email && <p className="error-msg">{errors.email}</p>}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">Password</label>
                        <Link href={route('password.request')} className="text-xs text-clinic-600 hover:text-clinic-700 transition-colors">Forgot password?</Link>
                    </div>
                    <div className="relative">
                        <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            className={`input pl-9 ${errors.password ? 'input-error' : ''}`}
                            placeholder="••••••••"
                        />
                    </div>
                    {errors.password && <p className="error-msg">{errors.password}</p>}
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" id="remember" checked={data.remember} onChange={e => setData('remember', e.target.checked)} className="rounded border-gray-300 text-clinic-600 focus:ring-clinic-500" />
                    <label htmlFor="remember" className="text-sm text-gray-600">Remember me</label>
                </div>

                <button type="submit" disabled={processing} className="btn-primary w-full btn-lg">
                    {processing ? 'Signing in…' : 'Sign in'}
                </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
                Contact the clinic admin if you need access.
            </p>
            <p className="text-center mt-3">
                <Link href={route('home')} className="text-xs text-clinic-600 hover:text-clinic-700 transition-colors">← Back to Home</Link>
            </p>
        </GuestLayout>
    );
}
