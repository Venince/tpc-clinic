import { useForm, Head, Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    return (
        <GuestLayout>
            <Head title="Forgot Password" />
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
            <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

            {status && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{status}</div>}

            <form onSubmit={e => { e.preventDefault(); post(route('password.email')); }} className="space-y-4">
                <div>
                    <label className="label">Email address</label>
                    <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className={`input pl-9 ${errors.email ? 'input-error' : ''}`}
                            placeholder="you@gmail.com"
                            autoFocus
                        />
                    </div>
                    {errors.email && <p className="error-msg">{errors.email}</p>}
                </div>
                <button type="submit" disabled={processing} className="btn-primary w-full btn-lg">
                    {processing ? 'Sending…' : 'Send Reset Link'}
                </button>
                <Link href={route('login')} className="block text-center text-sm text-clinic-600 hover:text-clinic-700 transition-colors">← Back to sign in</Link>
            </form>
        </GuestLayout>
    );
}
