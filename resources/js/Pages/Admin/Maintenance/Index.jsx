import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { WrenchScrewdriverIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function MaintenanceIndex({ settings }) {
    const { data, setData, put, processing, errors } = useForm({
        enabled: !!settings.enabled,
        message: settings.message || '',
        ends_at: settings.ends_at || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (data.enabled && !settings.enabled &&
            !confirm('Turn ON maintenance mode? Students and faculty will be blocked right away. Admins are not affected.')) {
            return;
        }
        put(route('admin.maintenance.update'), { preserveScroll: true });
    };

    return (
        <AdminLayout title="Maintenance">
            <Head title="Maintenance" />

            <div className="max-w-2xl mx-auto w-full space-y-4">
                <form onSubmit={submit} className="card">
                    <div className="card-body space-y-5">
                        {/* Switch */}
                        <div className="flex items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                    <WrenchScrewdriverIcon className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">Maintenance mode</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {settings.enabled
                                            ? <>Currently <span className="font-medium text-gray-700">ON</span>{settings.enabled_at && <> since {new Date(settings.enabled_at).toLocaleString()}</>}.</>
                                            : <>Currently <span className="font-medium text-gray-700">OFF</span>. The portal is available to everyone.</>}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={data.enabled}
                                aria-label="Toggle maintenance mode"
                                onClick={() => setData('enabled', !data.enabled)}
                                className={clsx(
                                    'relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                                    data.enabled ? 'bg-clinic-600' : 'bg-gray-300'
                                )}
                            >
                                <span className={clsx(
                                    'inline-block h-5 w-5 mt-1 rounded-full bg-white shadow transform transition-transform',
                                    data.enabled ? 'translate-x-6' : 'translate-x-1'
                                )} />
                            </button>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="label" htmlFor="maintenance-message">
                                Message for visitors <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                id="maintenance-message"
                                name="message"
                                rows={3}
                                maxLength={255}
                                value={data.message}
                                onChange={e => setData('message', e.target.value)}
                                className="input resize-y"
                                placeholder="e.g. We're updating the system. Appointments and requests will be back shortly."
                            />
                            <div className="flex justify-between text-xs mt-1">
                                <span className="text-red-500">{errors.message}</span>
                                <span className="text-gray-400">{data.message.length}/255</span>
                            </div>
                        </div>

                        {/* Expected back */}
                        <div>
                            <label className="label" htmlFor="maintenance-ends-at">
                                Expected back <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                id="maintenance-ends-at"
                                name="ends_at"
                                type="datetime-local"
                                value={data.ends_at}
                                onChange={e => setData('ends_at', e.target.value)}
                                className="input"
                            />
                            {errors.ends_at && <p className="text-xs text-red-500 mt-1">{errors.ends_at}</p>}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-end pt-1">
                            <button type="submit" disabled={processing} className="btn-primary w-full sm:w-auto justify-center disabled:opacity-50">
                                {processing ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* What it does */}
                <div className="rounded-xl border border-gray-200 bg-white px-4 sm:px-5 py-4 text-sm text-gray-600 space-y-2">
                    <p className="flex items-center gap-2 font-medium text-gray-900">
                        <InformationCircleIcon className="w-4 h-4" /> How it works
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Students and faculty see an "Under Maintenance" page and can't sign in.</li>
                        <li>Admins and super admins can keep working as normal.</li>
                        <li>Home, Announcements and the Privacy Policy stay visible, with a notice at the top.</li>
                        <li>The expected-back time is only shown to visitors. Maintenance does <strong>not</strong> turn off by itself, so switch it off here when you're done.</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}
