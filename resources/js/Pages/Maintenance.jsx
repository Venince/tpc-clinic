import { Head, Link, router, usePage } from '@inertiajs/react';
import { WrenchScrewdriverIcon, ArrowPathIcon, HomeIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { formatExpectedBack } from '@/Components/Common/MaintenanceBanner';

export default function Maintenance({ message, ends_at }) {
    const { auth } = usePage().props;
    const back = formatExpectedBack(ends_at);

    return (
        <>
            <Head title="Under Maintenance — TPC e-Clinic" />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10 font-sans">
                <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm px-6 sm:px-8 py-10 text-center">
                    <img src="/images/tpc-logo.png" alt="TPC e-Clinic" className="w-16 h-16 object-contain mx-auto mb-5" />

                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                        <WrenchScrewdriverIcon className="w-6 h-6 text-green-600" />
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">We'll be right back</h1>
                    <p className="mt-2 text-sm text-gray-500">TPC e-Clinic is currently under maintenance.</p>

                    {message && (
                        <p className="mt-4 text-sm text-gray-700 whitespace-pre-line break-words bg-gray-50 rounded-lg px-4 py-3 text-left">
                            {message}
                        </p>
                    )}

                    {back && (
                        <p className="mt-4 text-sm text-gray-500">
                            Expected back: <span className="font-medium text-gray-900">{back}</span>
                        </p>
                    )}

                    <div className="mt-8 flex flex-col sm:flex-row gap-2.5 justify-center">
                        <button type="button" onClick={() => window.location.reload()} className="btn-primary justify-center">
                            <ArrowPathIcon className="w-4 h-4 mr-1.5" /> Try again
                        </button>
                        <Link href={route('home')} className="btn-secondary justify-center">
                            <HomeIcon className="w-4 h-4 mr-1.5" /> Back to Home
                        </Link>
                        {auth?.user && (
                            <button type="button" onClick={() => router.post(route('logout'))} className="btn-secondary justify-center">
                                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1.5" /> Sign out
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
