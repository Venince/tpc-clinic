<?php
namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return md5_file(public_path('build/manifest.json')) ?: null;
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id'                    => $user->id,
                    'name'                  => $user->name,
                    'email'                 => $user->email,
                    'role' => $user->role ? [
                    'name'                  => $user->role->name,
                    'display_name'          => $user->role->display_name,
                ] : null,
                    'force_password_change' => $user->force_password_change,
                    'profile_photo_url'     => $user->profile_photo_url,
                ] : null,
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error'   => fn() => $request->session()->get('error'),
            ],
            'ziggy' => fn() => [
                ...(new \Tighten\Ziggy\Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            // Shared with all layouts so the bell works everywhere
            'notifications' => fn() => $user ? [
                'unread_count' => $user->unreadNotifications()->count(),
                'latest'       => $user->notifications()->limit(8)->get()->map(fn($n) => [
                    'id'         => $n->id,
                    'data'       => $n->data,
                    'read_at'    => $n->read_at,
                    'created_at' => $n->created_at,
                ]),
            ] : null,
        ]);
    }
}