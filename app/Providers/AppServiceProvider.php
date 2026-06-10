<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->input('email').'|'.$request->ip());
        });

        // Redirect authenticated users to their dashboard instead of '/'
        \Illuminate\Support\Facades\Auth::resolved(function ($auth) {
            app(\Illuminate\Auth\Middleware\RedirectIfAuthenticated::class)::redirectUsing(function (Request $request) use ($auth) {
                $user = $auth->guard()->user();
                if (!$user) return '/';

                return match($user->role->name) {
                    'admin', 'super_admin' => route('admin.dashboard'),
                    'student'              => route('student.dashboard'),
                    'faculty_staff'        => route('faculty.dashboard'),
                    default                => '/',
                };
            });
        });
    }
}