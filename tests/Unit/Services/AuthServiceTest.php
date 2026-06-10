<?php

namespace Tests\Unit\Services;

use App\Models\Role;
use App\Models\User;
use App\Repositories\Eloquent\UserRepository;
use App\Services\AuditService;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AuthServiceTest extends TestCase
{
    use RefreshDatabase;

    private AuthService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AuthService(new UserRepository(), new AuditService());
    }

    private function makeUser(string $role = 'student', array $overrides = []): User
    {
        $r = Role::where('name', $role)->firstOrFail();
        return User::factory()->create(array_merge([
            'role_id'               => $r->id,
            'password'              => Hash::make('Password@123'),
            'force_password_change' => false,
            'is_active'             => true,
        ], $overrides));
    }

    public function test_login_returns_token_and_user(): void
    {
        $user   = $this->makeUser();
        $result = $this->service->login(['email' => $user->email, 'password' => 'Password@123'], '127.0.0.1');

        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('user', $result);
        $this->assertFalse($result['force_password_change']);
    }

    public function test_login_updates_last_login_at(): void
    {
        $user = $this->makeUser();
        $this->service->login(['email' => $user->email, 'password' => 'Password@123'], '192.168.1.1');

        $this->assertNotNull($user->fresh()->last_login_at);
        $this->assertEquals('192.168.1.1', $user->fresh()->last_login_ip);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = $this->makeUser();
        $this->expectException(ValidationException::class);
        $this->service->login(['email' => $user->email, 'password' => 'WrongPassword'], '127.0.0.1');
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = $this->makeUser('student', ['is_active' => false]);
        $this->expectException(ValidationException::class);
        $this->service->login(['email' => $user->email, 'password' => 'Password@123'], '127.0.0.1');
    }

    public function test_change_password_clears_force_change_flag(): void
    {
        $user = $this->makeUser('student', ['force_password_change' => true]);
        $this->service->changePassword($user, 'Password@123', 'NewPass@456');

        $this->assertFalse($user->fresh()->force_password_change);
        $this->assertTrue(Hash::check('NewPass@456', $user->fresh()->password));
    }

    public function test_change_password_fails_with_wrong_current(): void
    {
        $user = $this->makeUser();
        $this->expectException(ValidationException::class);
        $this->service->changePassword($user, 'WrongCurrentPassword', 'NewPass@456');
    }

    public function test_force_password_change_flag_set_on_new_user(): void
    {
        $user = $this->makeUser('student', ['force_password_change' => true]);
        $result = $this->service->login(['email' => $user->email, 'password' => 'Password@123'], '127.0.0.1');

        $this->assertTrue($result['force_password_change']);
    }
}
