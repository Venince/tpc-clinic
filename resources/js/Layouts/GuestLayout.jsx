import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-clinic-900 via-clinic-800 to-clinic-700 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <img src="/images/tpc-logo.png" alt="TPC Logo" className="w-20 h-20 object-contain mx-auto mb-3" />
                        <h1 className="text-gray-900 text-2xl font-bold">TPC e-Clinic</h1>
                        <p className="text-gray-500 text-sm mt-1">Talibon Polytechnic College</p>
                    </div>
                    {children}
                </div>

                <p className="text-center text-clinic-200 text-xs mt-6">
                    © {new Date().getFullYear()} Talibon Polytechnic College Clinic
                </p>
            </div>
        </div>
    );
}
