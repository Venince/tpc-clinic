/**
 * UserAvatar
 *
 * Props:
 *   user        – object with { name, profile_photo_url }
 *   size        – 'xs' | 'sm' (default) | 'md' | 'lg' | 'xl'
 *   className   – extra classes for the wrapper
 *   onClick     – optional. If provided and the user has a profile photo,
 *                 the avatar becomes clickable (e.g. to open a lightbox).
 *                 Click events are stopped from propagating so this works
 *                 safely inside clickable rows.
 */
export default function UserAvatar({ user, size = 'sm', className = '', onClick }) {
    const sizeClasses = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-24 h-24 text-2xl',
    };

    const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
    const clickable = Boolean(onClick && user?.profile_photo_url);

    return (
        <div
            onClick={clickable ? (e) => { e.stopPropagation(); onClick(); } : undefined}
            className={`${sizeClasses[size] ?? sizeClasses.sm} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center bg-clinic-100 ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-clinic-400 transition-shadow' : ''} ${className}`}
        >
            {user?.profile_photo_url ? (
                <img
                    src={user.profile_photo_url}
                    alt={user.name ?? 'User'}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className="font-semibold text-clinic-700 leading-none select-none">
                    {initial}
                </span>
            )}
        </div>
    );
}
