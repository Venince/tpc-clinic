import { useForm, Head } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token, email: email || '', password: '', password_confirmation: '',
    });

    return (
        <GuestLayout>
            <Head title="Reset Password" />
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Set New Password</h2>
            <form onSubmit={e => { e.preventDefault(); post(route('password.update')); }} className="space-y-4">
                {[
                    { key: 'email', type: 'email', label: 'Email', autoComplete: 'email' },
                    { key: 'password', type: 'password', label: 'New Password', autoComplete: 'new-password' },
                    { key: 'password_confirmation', type: 'password', label: 'Confirm Password', autoComplete: 'new-password' },
                ].map(({ key, type, label, autoComplete }) => (
                    <div key={key}>
                        <label className="label" htmlFor={key}>{label}</label>
                        <input id={key} name={key} type={type} autoComplete={autoComplete}
                            value={data[key]} onChange={e => setData(key, e.target.value)}
                            className={`input ${errors[key] ? 'input-error' : ''}`} />
                        {errors[key] && <p className="error-msg">{errors[key]}</p>}
                    </div>
                ))}
                <button type="submit" disabled={processing} className="btn-primary w-full">
                    {processing ? 'Resetting…' : 'Reset Password'}
                </button>
            </form>
        </GuestLayout>
    );
}
