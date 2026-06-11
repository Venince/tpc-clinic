import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';

export default function ProfilePhotoUploader({ photoUrl, uploadRoute, deleteRoute }) {
    const inputRef  = useRef(null);
    const [preview, setPreview] = useState(photoUrl || null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);

    const initials = null; // parent can pass name for fallback if desired

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Client-side size guard (2 MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('Image must be under 2 MB.');
            return;
        }

        setError(null);
        setPreview(URL.createObjectURL(file));
        setLoading(true);

        router.post(uploadRoute, { photo: file }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
            onError: (errs) => {
                setError(errs.photo ?? 'Upload failed.');
                setPreview(photoUrl || null);
                setLoading(false);
            },
        });

        // Reset input so the same file can be re-selected after an error
        e.target.value = '';
    };

    const handleDelete = () => {
        if (!preview) return;
        setLoading(true);
        router.delete(deleteRoute, {
            preserveScroll: true,
            onSuccess: () => { setPreview(null); setLoading(false); },
            onError: ()  => setLoading(false),
        });
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Avatar */}
            <div className="relative group">
                <div
                    className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-md
                                flex items-center justify-center cursor-pointer"
                    onClick={() => !loading && inputRef.current?.click()}
                >
                    {preview ? (
                        <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                fill="currentColor" className="w-12 h-12">
                                <path fillRule="evenodd"
                                    d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                                    clipRule="evenodd" />
                            </svg>
                        </span>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center
                                    opacity-0 group-hover:opacity-100 transition-opacity">
                        {loading ? (
                            <svg className="animate-spin w-6 h-6 text-white"
                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10"
                                    stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                fill="currentColor" className="w-6 h-6 text-white">
                                <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                                <path fillRule="evenodd"
                                    d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z"
                                    clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Remove button */}
                {preview && !loading && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600
                                   rounded-full flex items-center justify-center text-white shadow
                                   transition-colors"
                        title="Remove photo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
                        </svg>
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="text-xs text-clinic-600 hover:text-clinic-800 font-medium disabled:opacity-50"
            >
                {preview ? 'Change photo' : 'Upload photo'}
            </button>

            {error && <p className="text-xs text-red-500">{error}</p>}
            <p className="text-xs text-gray-400">JPG, PNG or WebP · max 2 MB</p>
        </div>
    );
}