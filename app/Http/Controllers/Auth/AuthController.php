<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\Maintenance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login', [
            'lockout_seconds' => session('lockout_seconds', 0),
            // Passed explicitly so the "password reset" confirmation always reaches
            // the page, whatever HandleInertiaRequests does or does not share.
            'status'          => session('status'),
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $request->validate(['remember' => ['sometimes', 'boolean']]);

        // Normalised so "Juan@X.com" and "juan@x.com" share one counter.
        [$key, $lockoutKey] = $this->throttleKeys($credentials['email'], $request->ip());

        // Lockout check
        if (Cache::has($lockoutKey)) {
            $seconds = max(0, (int) Cache::get($lockoutKey) - time());
            $minutes = ceil($seconds / 60);
            return redirect()->route('login')
                ->withInput($request->only('email'))
                ->withErrors(['email' => "Too many failed attempts. Try again in {$minutes} minute(s)."])
                ->with('lockout_seconds', $seconds);
        }

        $remember = $request->boolean('remember');
        $loggedIn = Auth::attempt($credentials, $remember);

        // Copying a temporary password out of an email often drags along a trailing
        // space or newline, and TrimStrings deliberately never trims "password".
        // Generated passwords never contain whitespace, so retry once without it.
        // Only a failure of BOTH tries counts toward the lockout.
        if (!$loggedIn) {
            $trimmed = trim($credentials['password']);

            if ($trimmed !== '' && $trimmed !== $credentials['password']) {
                $loggedIn = Auth::attempt(
                    ['email' => $credentials['email'], 'password' => $trimmed],
                    $remember
                );
            }
        }

        if (!$loggedIn) {
            $attempts = Cache::get($key, 0) + 1;
            Cache::put($key, $attempts, now()->addHour());

            if ($attempts % 5 === 0) {
                $lockMinutes = intdiv($attempts, 5);
                $lockSeconds = $lockMinutes * 60;
                Cache::put($lockoutKey, time() + $lockSeconds, now()->addSeconds($lockSeconds));

                return redirect()->route('login')
                    ->withInput($request->only('email'))
                    ->withErrors(['email' => "Too many failed attempts. Locked out for {$lockMinutes} minute(s)."])
                    ->with('lockout_seconds', $lockSeconds);
            }

            $remaining = 5 - ($attempts % 5);
            return redirect()->route('login')
                ->withInput($request->only('email'))
                ->withErrors(['email' => "Incorrect credentials. {$remaining} attempt(s) left before lockout."]);
        }

        // The password was right, so the brute-force counters no longer apply.
        Cache::forget($key);
        Cache::forget($lockoutKey);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->is_active) {
            // Full teardown — otherwise a lingering "remember me" cookie could
            // silently re-authenticate a deactivated account later.
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->withInput($request->only('email'))
                ->withErrors(['email' => 'Your account has been deactivated.']);
        }

        // A user with no (or an unrecognised) role can't be routed anywhere; without
        // this they'd be bounced to the guest-only login route in a redirect loop.
        if (!$user->role || $this->dashboardRoute($user) === 'login') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->withInput($request->only('email'))
                ->withErrors(['email' => 'Your account has no valid role assigned. Contact the clinic admin.']);
        }

        // Maintenance mode: only admins may sign in. Checked before last_login_at is
        // touched, so a blocked student still counts as "never logged in".
        if (Maintenance::blocksUser($user)) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->withInput($request->only('email'))
                ->withErrors(['email' => Maintenance::loginMessage()]);
        }

        $user->update(['last_login_at' => now(), 'last_login_ip' => $request->ip()]);

        AuditLog::create([
            'user_id'    => $user->id,
            'action'     => 'login',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $request->session()->regenerate();

        if ($user->force_password_change) {
            return Inertia::location(route('password.change'));
        }

        return Inertia::location(route($this->dashboardRoute($user)));
    }

    public function logout(Request $request)
    {
        AuditLog::create([
            'user_id'    => Auth::id(),
            'action'     => 'logout',
            'ip_address' => $request->ip(),
        ]);

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    public function showChangePassword(): Response
    {
        return Inertia::render('Auth/ChangePassword');
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'confirmed', 'different:current_password', Password::min(8)->mixedCase()->numbers()],
        ], [
            'password.different' => 'Your new password must be different from your current/temporary password.',
        ]);

        $user    = $request->user();
        $current = $data['current_password'];

        // Same leniency as login: a pasted temporary password may carry stray whitespace.
        $matches = Hash::check($current, $user->password)
            || (trim($current) !== $current && Hash::check(trim($current), $user->password));

        if (!$matches) {
            return back()->withErrors(['current_password' => 'The current password is incorrect.']);
        }

        $user->update([
            'password'              => Hash::make($data['password']),
            'force_password_change' => false,
        ]);

        AuditLog::create([
            'user_id'    => $user->id,
            'action'     => 'password_changed',
            'ip_address' => $request->ip(),
        ]);

        return redirect()->route($this->dashboardRoute($user))
            ->with('success', 'Password changed successfully.');
    }

    public function showForgotPassword(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            // Without this the "reset link has been sent" confirmation can be invisible,
            // users assume nothing happened, click again, and hit the 60-second throttle.
            'status' => session('status'),
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        try {
            $status = PasswordBroker::sendResetLink($request->only('email'));
        } catch (\Throwable $e) {
            // Mail transport failure (e.g. Gmail daily limit). Log it and show a
            // friendly message instead of a 500 page.
            report($e);

            // The broker already stored a token before the mail failed. Remove it so
            // the user can retry right away instead of waiting out the 60s throttle.
            try {
                if ($user = PasswordBroker::getUser($request->only('email'))) {
                    PasswordBroker::deleteToken($user);
                }
            } catch (\Throwable) {
                // best effort only
            }

            return back()->withErrors([
                'email' => 'We could not send the email right now. Please try again later or contact the clinic office.',
            ]);
        }

        if ($status === PasswordBroker::RESET_THROTTLED) {
            return back()->withErrors(['email' => __($status)]);
        }

        // Same answer whether or not the address is registered (no account enumeration).
        return back()->with('status', 'If that email address is registered, a password reset link has been sent.');
    }

    public function showResetPassword(Request $request): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $request->route('token'),
            'email' => $request->email,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => ['required'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        $status = PasswordBroker::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) use ($request) {
                $user->forceFill([
                    'password'              => Hash::make($password),
                    'force_password_change' => false,
                    // Rotating this signs out every "remember me" session that
                    // belonged to the old password.
                    'remember_token'        => Str::random(60),
                ])->save();

                AuditLog::create([
                    'user_id'    => $user->id,
                    'action'     => 'password_reset',
                    'ip_address' => $request->ip(),
                ]);
            }
        );

        if ($status === PasswordBroker::PASSWORD_RESET) {
            // They proved ownership of the mailbox, so a lockout caused by mistyped
            // temporary passwords must not keep them out after a successful reset.
            [$key, $lockoutKey] = $this->throttleKeys($request->input('email'), $request->ip());
            Cache::forget($key);
            Cache::forget($lockoutKey);

            return redirect()->route('login')
                ->with('status', 'Your password has been reset. You can now sign in.');
        }

        return back()->withErrors(['email' => __($status)]);
    }

    /** @return array{0: string, 1: string} [attempts key, lockout key] */
    private function throttleKeys(string $email, ?string $ip): array
    {
        $identity = Str::lower(trim($email)) . '|' . $ip;

        return ['login_attempts:' . md5($identity), 'login_lockout:' . md5($identity)];
    }

    private function dashboardRoute($user): string
    {
        return match ($user->role?->name) {
            'admin', 'super_admin' => 'admin.dashboard',
            'student'              => 'student.dashboard',
            'faculty_staff'        => 'faculty.dashboard',
            default                => 'login',
        };
    }
}