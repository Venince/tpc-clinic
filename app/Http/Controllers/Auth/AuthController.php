<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login', [
            'lockout_seconds' => session('lockout_seconds', 0),
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $key        = 'login_attempts:' . md5($credentials['email'] . '|' . $request->ip());
        $lockoutKey = 'login_lockout:'  . md5($credentials['email'] . '|' . $request->ip());

        // Lockout check
        if (Cache::has($lockoutKey)) {
            $seconds = max(0, (int) Cache::get($lockoutKey) - time());
            $minutes = ceil($seconds / 60);
            return redirect()->route('login')
                ->withInput($request->only('email'))
                ->withErrors(['email' => "Too many failed attempts. Try again in {$minutes} minute(s)."])
                ->with('lockout_seconds', $seconds);
        }

        if (!Auth::attempt($credentials, $request->boolean('remember'))) {
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

        /** @var \App\Models\User $user */
        $user = \App\Models\User::find(Auth::id());

        if (!$user->is_active) {
            Auth::logout();
            return back()->withErrors(['email' => 'Your account has been deactivated.'])->onlyInput('email');
        }

        // Clear on success
        Cache::forget($key);
        Cache::forget($lockoutKey);

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
            'current_password'      => ['required', 'string'],
            'password'              => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        if (!Hash::check($data['current_password'], $request->user()->password)) {
            return back()->withErrors(['current_password' => 'The current password is incorrect.']);
        }

        $request->user()->update([
            'password'              => Hash::make($data['password']),
            'force_password_change' => false,
        ]);

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => 'password_changed',
            'ip_address' => $request->ip(),
        ]);

        return redirect()->route($this->dashboardRoute($request->user()))
            ->with('success', 'Password changed successfully.');
    }

    public function showForgotPassword(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = \Illuminate\Support\Facades\Password::sendResetLink($request->only('email'));

        return back()->with('status', __($status));
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

        $status = \Illuminate\Support\Facades\Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill(['password' => Hash::make($password), 'force_password_change' => false])->save();
            }
        );

        if ($status === \Illuminate\Support\Facades\Password::PASSWORD_RESET) {
            return redirect()->route('login')->with('success', 'Password reset successfully.');
        }

        return back()->withErrors(['email' => __($status)]);
    }

    private function dashboardRoute($user): string
    {
        return match ($user->role->name) {
            'admin', 'super_admin' => 'admin.dashboard',
            'student'              => 'student.dashboard',
            'faculty_staff'        => 'faculty.dashboard',
            default                => 'login',
        };
    }
}
