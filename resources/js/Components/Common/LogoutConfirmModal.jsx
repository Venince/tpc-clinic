import { useEffect } from 'react';
import { ArrowRightOnRectangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function LogoutConfirmModal({ onConfirm, onCancel }) {
    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Sheet / Dialog */}
            <div className="
                relative bg-white w-full sm:max-w-sm sm:rounded-xl sm:mx-4
                rounded-t-2xl shadow-2xl
                animate-slide-up sm:animate-none
            ">
                {/* Drag handle — mobile only */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    aria-label="Close"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="px-6 pt-4 pb-6 sm:pt-6">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
                        <ArrowRightOnRectangleIcon className="w-6 h-6 text-red-500" />
                    </div>

                    <h3 className="font-semibold text-gray-900 text-lg text-center mb-1">
                        Log out?
                    </h3>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Are you sure you want to log out of TPC e-Clinic?
                    </p>

                    {/* Buttons — stacked on mobile, side by side on sm+ */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <button
                            onClick={onCancel}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-medium transition-colors"
                        >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            Yes, log out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}