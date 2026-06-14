import { useRef, useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';

// ── Cropper Modal ─────────────────────────────────────────────────────────────
function CropperModal({ imageSrc, onConfirm, onCancel }) {
    const canvasRef   = useRef(null);
    const displayRef  = useRef(null);
    const dragging    = useRef(false);
    const lastPos     = useRef({ x: 0, y: 0 });

    // crop state: offset (cx,cy) = top-left of the image relative to canvas, scale
    const state = useRef({ cx: 0, cy: 0, scale: 1, imgW: 0, imgH: 0, canvasSize: 300 });
    const imgRef = useRef(new Image());
    const [zoom, setZoom] = useState(1);

    const CANVAS = 300; // display canvas px

    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    const draw = useCallback(() => {
        const canvas = displayRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { cx, cy, scale, imgW, imgH } = state.current;
        const w = imgW * scale;
        const h = imgH * scale;
        ctx.clearRect(0, 0, CANVAS, CANVAS);

        // image
        ctx.drawImage(imgRef.current, cx, cy, w, h);

        // dark vignette outside circle
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, CANVAS, CANVAS);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(CANVAS / 2, CANVAS / 2, CANVAS / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // circle border
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(CANVAS / 2, CANVAS / 2, CANVAS / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }, []);

    const constrainOffset = useCallback((cx, cy) => {
        const { scale, imgW, imgH } = state.current;
        const w = imgW * scale;
        const h = imgH * scale;
        // image must cover the full canvas
        const minX = CANVAS - w;
        const minY = CANVAS - h;
        return {
            cx: clamp(cx, minX, 0),
            cy: clamp(cy, minY, 0),
        };
    }, []);

    // load image, fit to canvas
    useEffect(() => {
        const img = imgRef.current;
        img.onload = () => {
            const scale = Math.max(CANVAS / img.naturalWidth, CANVAS / img.naturalHeight);
            const cx = (CANVAS - img.naturalWidth  * scale) / 2;
            const cy = (CANVAS - img.naturalHeight * scale) / 2;
            state.current = { cx, cy, scale, imgW: img.naturalWidth, imgH: img.naturalHeight, canvasSize: CANVAS };
            setZoom(scale);
            draw();
        };
        img.src = imageSrc;
    }, [imageSrc, draw]);

    // redraw on zoom slider
    const handleZoom = (e) => {
        const newScale = parseFloat(e.target.value);
        const { cx, cy, scale, imgW, imgH } = state.current;
        // zoom around canvas centre
        const centerX = CANVAS / 2;
        const centerY = CANVAS / 2;
        const ratio = newScale / scale;
        const newCx = centerX - (centerX - cx) * ratio;
        const newCy = centerY - (centerY - cy) * ratio;
        const clamped = constrainOffset(newCx, newCy);
        state.current = { ...state.current, scale: newScale, ...clamped };
        setZoom(newScale);
        draw();
    };

    // drag handlers
    const onPointerDown = (e) => {
        dragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
        if (!dragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        const { cx, cy } = state.current;
        const clamped = constrainOffset(cx + dx, cy + dy);
        state.current = { ...state.current, ...clamped };
        draw();
    };
    const onPointerUp = () => { dragging.current = false; };

    // export cropped circle as blob
    const handleConfirm = () => {
        const out = canvasRef.current;
        out.width  = CANVAS;
        out.height = CANVAS;
        const ctx = out.getContext('2d');
        const { cx, cy, scale, imgW, imgH } = state.current;
        // clip to circle
        ctx.beginPath();
        ctx.arc(CANVAS / 2, CANVAS / 2, CANVAS / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(imgRef.current, cx, cy, imgW * scale, imgH * scale);
        out.toBlob(blob => onConfirm(blob), 'image/jpeg', 0.92);
    };

    const minScale = () => {
        const { imgW, imgH } = state.current;
        if (!imgW) return 1;
        return Math.max(CANVAS / imgW, CANVAS / imgH);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Crop profile photo</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
                        </svg>
                    </button>
                </div>

                {/* Display canvas — interactive */}
                <div className="flex justify-center">
                    <canvas
                        ref={displayRef}
                        width={CANVAS}
                        height={CANVAS}
                        className="rounded-full cursor-grab active:cursor-grabbing touch-none"
                        style={{ width: CANVAS, height: CANVAS }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                    />
                </div>

                {/* Hidden export canvas */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Zoom */}
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 shrink-0">
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd"/>
                    </svg>
                    <input
                        type="range"
                        min={minScale()}
                        max={minScale() * 3}
                        step={0.01}
                        value={zoom}
                        onChange={handleZoom}
                        className="w-full accent-green-600"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400 shrink-0">
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd"/>
                    </svg>
                </div>

                <p className="text-xs text-gray-400 text-center -mt-2">Drag to reposition · scroll slider to zoom</p>

                <div className="flex gap-3">
                    <button
                        onClick={handleConfirm}
                        className="flex-1 bg-clinic-600 hover:bg-clinic-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                    >
                        Save photo
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main uploader ─────────────────────────────────────────────────────────────
export default function ProfilePhotoUploader({ photoUrl, uploadRoute, deleteRoute }) {
    const inputRef   = useRef(null);
    const [preview,  setPreview]  = useState(photoUrl || null);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);
    const [cropSrc,  setCropSrc]  = useState(null); // raw file object URL for cropper

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { // allow bigger raw; we'll compress on crop
            setError('Image must be under 10 MB.');
            return;
        }
        setError(null);
        setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const handleCropConfirm = (blob) => {
        setCropSrc(null);
        const localUrl = URL.createObjectURL(blob);
        setPreview(localUrl);
        setLoading(true);

        const form = new FormData();
        form.append('photo', blob, 'profile.jpg');

        router.post(uploadRoute, form, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setLoading(false),
            onError: (errs) => {
                setError(errs.photo ?? 'Upload failed.');
                setPreview(photoUrl || null);
                setLoading(false);
            },
        });
    };

    const handleCropCancel = () => {
        setCropSrc(null);
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
        <>
            {cropSrc && (
                <CropperModal
                    imageSrc={cropSrc}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                />
            )}

            <div className="flex flex-col items-center gap-3">
                {/* Avatar */}
                <div className="relative group">
                    <div
                        className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-md flex items-center justify-center cursor-pointer"
                        onClick={() => !loading && inputRef.current?.click()}
                    >
                        {preview ? (
                            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-gray-400">
                                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd"/>
                            </svg>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {loading ? (
                                <svg className="animate-spin w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                                    <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z"/>
                                    <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clipRule="evenodd"/>
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Remove button */}
                    {preview && !loading && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow transition-colors"
                            title="Remove photo"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
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
                <p className="text-xs text-gray-400">JPG, PNG or WebP · max 10 MB</p>
            </div>
        </>
    );
}
