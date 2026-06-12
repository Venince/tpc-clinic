/**
 * UserAvatar
 *
 * Props:
 *   user        – object with { name, profile_photo_url }
 *   size        – 'xs' | 'sm' (default) | 'md' | 'lg'
 *   className   – extra classes for the wrapper
 */
export default function UserAvatar({ user, size = 'sm', className = '' }) {
    const sizeClasses = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

    return (
        <div
            className={`${sizeClasses[size] ?? sizeClasses.sm} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center bg-clinic-100 ${className}`}
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
