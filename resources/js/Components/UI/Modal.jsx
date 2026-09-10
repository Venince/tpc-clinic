import { createPortal } from 'react-dom';

export default function Modal({ children, onClose, size = 'md' }) {
    const sizeClass = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg' }[size];

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/30 p-0 sm:p-4">
            <div
                className={`bg-white w-full sm:rounded-xl ${sizeClass} shadow-xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl`}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}