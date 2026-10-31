<?php

namespace App\Services;

use App\Jobs\SendCredentialsEmail;
use App\Models\Role;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Support\Maintenance;

class AuthService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private AuditService $auditService,
    ) {}

    public function login(array $credentials, string $ipAddress): array
    {
        // Same normalisation as the web login, so both share one counter per person.
        [$cacheKey, $lockoutKey] = $this->throttleKeys($credentials['email'], $ipAddress);

        // Check active lockout
        if (Cache::has($lockoutKey)) {
            $seconds = (int) Cache::get($lockoutKey) - time();
            throw ValidationException::withMessages([
                'email' => ["Too many failed attempts. Try again in {$this->formatSeconds($seconds)}."],
            ]);
        }

        $user = $this->userRepository->findByEmail($credentials['email']);

        // A pasted temporary password can carry stray whitespace; accept it trimmed too.
        $password = $credentials['password'];
        $matches  = $user && (
            Hash::check($password, $user->password)
            || (trim($password) !== $password && Hash::check(trim($password), $user->password))
        );

        if (!$matches) {
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

        // Without a role there are no token abilities to grant (and ->role->name would crash).
        if (!$user->role) {
            throw ValidationException::withMessages([
                'email' => ['Your account has no valid role assigned. Contact the clinic admin.'],
            ]);
        }

        if (Maintenance::blocksUser($user)) {
            throw ValidationException::withMessages([
                'email' => [Maintenance::loginMessage()],
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

    /** @return array{0: string, 1: string} [attempts key, lockout key] */
    private function throttleKeys(string $email, ?string $ip): array
    {
        $identity = Str::lower(trim($email)) . '|' . $ip;

        return ['login_attempts:' . md5($identity), 'login_lockout:' . md5($identity)];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
        $this->auditService->log('logout', $user->id);
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        $matches = Hash::check($currentPassword, $user->password)
            || (trim($currentPassword) !== $currentPassword && Hash::check(trim($currentPassword), $user->password));

        if (!$matches) {
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

        // Only the throttle is reported. An unknown address must look the same as a
        // known one, otherwise this endpoint can be used to discover who has an account.
        if ($status === Password::RESET_THROTTLED) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
    }

    /**
     * @param  string|null  $ipAddress  When given, the login lockout for this email+IP is
     *                                  cleared after a successful reset.
     */
    public function resetPassword(array $data, ?string $ipAddress = null): void
    {
        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password),
                'force_password_change' => false,
                // Signs out "remember me" sessions that belonged to the old password.
                'remember_token' => Str::random(60),
            ])->save();

            $this->auditService->log('password_reset', $user->id);
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        if ($ipAddress !== null && !empty($data['email'])) {
            [$cacheKey, $lockoutKey] = $this->throttleKeys($data['email'], $ipAddress);
            Cache::forget($cacheKey);
            Cache::forget($lockoutKey);
        }
    }

    public function bulkCreateFromEmailFile(UploadedFile $file, string $roleSlug, int $adminId): array
    {
        $content = file_get_contents($file->getRealPath());

        // Strip a UTF-8 byte-order mark (Windows Notepad/Excel add one); otherwise the
        // first line is rejected as an "invalid email" without any visible reason.
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);

        $emails = array_values(array_unique(array_map(
            fn ($line) => Str::lower(trim($line)),
            array_filter(preg_split('/\r\n|\r|\n/', $content), fn ($line) => trim($line) !== '')
        )));

        $role = Role::where('name', $roleSlug)->firstOrFail();

        $results = ['created' => [], 'failed' => [], 'skipped' => []];
        $toSend  = [];

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

                $password = User::generateTemporaryPassword();
                $name = ucwords(str_replace(['.', '_', '-'], ' ', explode('@', $email)[0]));

                $user = User::create([
                    'role_id' => $role->id,
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make($password),
                    'force_password_change' => true,
                    'is_active' => true,
                ]);

                $toSend[] = [$user, $password];

                $results['created'][] = ['email' => $email, 'name' => $name];

                $this->auditService->log('user_created', $adminId, 'User', $user->id,
                    null, ['email' => $email, 'role' => $roleSlug]);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        // Dispatch only after the commit. Inside the transaction, a rollback would leave
        // emails already queued for accounts that no longer exist, and a fast worker
        // could look the user up before it is visible. Spacing the sends eases
        // provider rate limits (it has no effect with the sync queue driver).
        foreach ($toSend as $i => [$user, $password]) {
            SendCredentialsEmail::dispatch($user, $password)->delay(now()->addSeconds($i * 2));
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