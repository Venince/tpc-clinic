import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * PhotoLightbox
 *
 * Full-screen overlay for viewing a profile photo at full size.
 * Renders nothing if photoUrl is falsy, so it's safe to always mount.
 *
 * Props:
 *   photoUrl – the image URL to display
 *   name     – optional label shown under the photo
 *   onClose  – called when the backdrop, image, or close button is clicked
 */
export default function PhotoLightbox({ photoUrl, name, onClose }) {
    if (!photoUrl) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
                aria-label="Close"
            >
                <XMarkIcon className="w-7 h-7" />
            </button>
            <img
                src={photoUrl}
                alt={name ?? 'Profile photo'}
                className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
            />
            {name && (
                <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                    {name}
                </p>
            )}
        </div>,
        document.body
    );
}
