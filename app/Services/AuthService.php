<?php

namespace App\Services;

use App\Jobs\SendCredentialsEmail;
use App\Models\Role;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AuthService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private AuditService $auditService,
    ) {}

    public function login(array $credentials, string $ipAddress): array
    {
        $cacheKey   = 'login_attempts:' . md5($credentials['email'] . '|' . $ipAddress);
        $lockoutKey = 'login_lockout:'  . md5($credentials['email'] . '|' . $ipAddress);

        // Check active lockout
        if (Cache::has($lockoutKey)) {
            $seconds = (int) Cache::get($lockoutKey) - time();
            throw ValidationException::withMessages([
                'email' => ["Too many failed attempts. Try again in {$this->formatSeconds($seconds)}."],
            ]);
        }

        $user = $this->userRepository->findByEmail($credentials['email']);

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            $attempts = Cache::get($cacheKey, 0) + 1;
            Cache::put($cacheKey, $attempts, now()->addHour());

            // Every 5 attempts, add a lockout minute
            if ($attempts % 5 === 0) {
                $lockMinutes = intdiv($attempts, 5);
                $lockSeconds = $lockMinutes * 60;
                Cache::put($lockoutKey, time() + $lockSeconds, now()->addSeconds($lockSeconds));

                throw ValidationException::withMessages([
                    'email' => ["Too many failed attempts. Locked out for {$lockMinutes} minute(s)."],
                ]);
            }

            $remaining = 5 - ($attempts % 5);
            throw ValidationException::withMessages([
                'email' => ["The provided credentials are incorrect. {$remaining} attempt(s) remaining before lockout."],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Contact the clinic admin.'],
            ]);
        }

        // Clear attempts on success
        Cache::forget($cacheKey);
        Cache::forget($lockoutKey);

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $ipAddress,
        ]);

        $token = $user->createToken('auth_token', $this->getAbilitiesForRole($user->role->name))->plainTextToken;

        $this->auditService->log('login', $user->id, null, null, null, null, $ipAddress);

        return [
            'user'                  => $user->load('role'),
            'token'                 => $token,
            'force_password_change' => $user->force_password_change,
        ];
    }

    private function formatSeconds(int $seconds): string
    {
        if ($seconds <= 0) return 'a moment';
        if ($seconds < 60) return "{$seconds} second(s)";
        $m = intdiv($seconds, 60);
        $s = $seconds % 60;
        return $s > 0 ? "{$m}m {$s}s" : "{$m} minute(s)";
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
        $this->auditService->log('logout', $user->id);
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (!Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($newPassword),
            'force_password_change' => false,
        ]);

        $this->auditService->log('password_change', $user->id);
    }

    public function sendPasswordResetLink(string $email): void
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
    }

    public function resetPassword(array $data): void
    {
        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password),
                'force_password_change' => false,
            ])->save();

            $this->auditService->log('password_reset', $user->id);
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
    }

    public function bulkCreateFromEmailFile(UploadedFile $file, string $roleSlug, int $adminId): array
    {
        $content = file_get_contents($file->getRealPath());
        $emails = array_filter(array_map('trim', explode("\n", $content)));

        $role = Role::where('name', $roleSlug)->firstOrFail();

        $results = ['created' => [], 'failed' => [], 'skipped' => []];

        DB::beginTransaction();
        try {
            foreach ($emails as $email) {
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $results['failed'][] = ['email' => $email, 'reason' => 'Invalid email format'];
                    continue;
                }

                if (User::where('email', $email)->exists()) {
                    $results['skipped'][] = ['email' => $email, 'reason' => 'Already exists'];
                    continue;
                }

                $password = Str::random(12);
                $name = ucwords(str_replace(['.', '_', '-'], ' ', explode('@', $email)[0]));

                $user = User::create([
                    'role_id' => $role->id,
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make($password),
                    'force_password_change' => true,
                    'is_active' => true,
                ]);

                // Queue email sending
                SendCredentialsEmail::dispatch($user, $password);

                $results['created'][] = ['email' => $email, 'name' => $name];

                $this->auditService->log('user_created', $adminId, 'User', $user->id,
                    null, ['email' => $email, 'role' => $roleSlug]);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $results;
    }

    private function getAbilitiesForRole(string $role): array
    {
        return match($role) {
            'super_admin' => ['*'],
            'admin' => ['read', 'write', 'manage'],
            'faculty_staff' => ['read', 'write'],
            'student' => ['read', 'write'],
            default => ['read'],
        };
    }
}
