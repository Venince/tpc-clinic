import { useForm, Head } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function ChangePassword() {
    const { data, setData, post, processing, errors } = useForm({
        current_password: '', password: '', password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.change.update'));
    };

    return (
        <GuestLayout>
            <Head title="Change Password" />
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl mb-3">
                    <LockClosedIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Set New Password</h2>
                <p className="text-gray-500 text-sm mt-1">You must change your temporary password before continuing.</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                {[
                    { key: 'current_password', label: 'Current / Temporary Password', placeholder: 'Enter your temporary password' },
                    { key: 'password', label: 'New Password', placeholder: 'At least 8 chars, mixed case + numbers' },
                    { key: 'password_confirmation', label: 'Confirm New Password', placeholder: 'Repeat new password' },
                ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                        <label className="label">{label}</label>
                        <input
                            type="password"
                            value={data[key]}
                            onChange={e => setData(key, e.target.value)}
                            className={`input ${errors[key] ? 'input-error' : ''}`}
                            placeholder={placeholder}
                        />
                        {errors[key] && <p className="error-msg">{errors[key]}</p>}
                    </div>
                ))}

                <button type="submit" disabled={processing} className="btn-primary w-full btn-lg mt-2">
                    {processing ? 'Updating…' : 'Update Password'}
                </button>
            </form>
        </GuestLayout>
    );
}
