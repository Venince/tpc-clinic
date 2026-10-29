<?php

namespace App\Providers;

use App\Repositories\Contracts\AppointmentRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\AppointmentRepository;
use App\Repositories\Eloquent\UserRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AppointmentRepositoryInterface::class, AppointmentRepository::class);
        // Was missing: the API login (AuthService) could not be built without it.
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
    }

    public function boot(): void
    {
        // Rate limiters live here (not in routes/web.php): with `php artisan optimize`
        // routes are cached and routes/web.php is never executed, so limiters defined
        // there would be "not defined" at request time.
        //
        // Keyed per email + IP (plus a loose per-IP ceiling), NOT per IP alone. A campus
        // network puts hundreds of users behind one public IP, so a strict per-IP limit
        // locks everyone out at once. The per-account brute-force lockout lives in
        // AuthController::login().
        RateLimiter::for('login', function (Request $request) {
            $email = Str::lower(trim((string) $request->input('email')));

            return [
                Limit::perMinute(10)->by('login:e:' . $email . '|' . $request->ip()),
                Limit::perMinute(600)->by('login:ip:' . $request->ip()),
            ];
        });

        RateLimiter::for('password-reset', function (Request $request) {
            $email = Str::lower(trim((string) $request->input('email')));

            return [
                Limit::perMinute(5)->by('pwreset:e:' . $email . '|' . $request->ip()),
                Limit::perMinute(120)->by('pwreset:ip:' . $request->ip()),
            ];
        });

        // Redirect authenticated users to their dashboard instead of '/'
        \Illuminate\Support\Facades\Auth::resolved(function ($auth) {
            app(\Illuminate\Auth\Middleware\RedirectIfAuthenticated::class)::redirectUsing(function (Request $request) use ($auth) {
                $user = $auth->guard()->user();
                if (!$user) return '/';

                return match($user->role?->name) {
                    'admin', 'super_admin' => route('admin.dashboard'),
                    'student'              => route('student.dashboard'),
                    'faculty_staff'        => route('faculty.dashboard'),
                    default                => '/',
                };
            });
        });
    }
}