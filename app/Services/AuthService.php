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

class AuthService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private AuditService $auditService,
    ) {}

    public function login(array $credentials, string $ipAddress): array
    {
        $user = $this->userRepository->findByEmail($credentials['email']);

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Contact the clinic admin.'],
            ]);
        }

        // Update last login
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $ipAddress,
        ]);

        $token = $user->createToken('auth_token', $this->getAbilitiesForRole($user->role->name))->plainTextToken;

        $this->auditService->log('login', $user->id, null, null, null, null, $ipAddress);

        return [
            'user' => $user->load('role'),
            'token' => $token,
            'force_password_change' => $user->force_password_change,
        ];
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
