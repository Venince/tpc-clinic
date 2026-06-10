export default function LogoutConfirmModal({ onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">Log out?</h3>
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to log out of TPC Clinic?</p>
                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        className="btn-primary flex-1"
                    >
                        Yes, log out
                    </button>
                    <button
                        onClick={onCancel}
                        className="btn-secondary flex-1"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}