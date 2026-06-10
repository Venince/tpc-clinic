<?php

namespace Tests\Feature\Admin;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $superAdmin;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin      = $this->createUserWithRole('admin');
        $this->superAdmin = $this->createUserWithRole('super_admin');
        $this->student    = $this->createUserWithRole('student');
    }

    private function createUserWithRole(string $roleName): User
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        return User::factory()->create([
            'role_id'               => $role->id,
            'force_password_change' => false,
            'is_active'             => true,
        ]);
    }

    public function test_admin_can_list_users(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_student_cannot_access_admin_user_list(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertStatus(403);
    }

    public function test_admin_can_create_user(): void
    {
        Queue::fake();

        $role = Role::where('name', 'student')->first();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'name'  => 'Test Student',
                'email' => 'teststudent@tpc.edu.ph',
                'role'  => 'student',
            ])->assertStatus(201)
            ->assertJsonPath('data.email', 'teststudent@tpc.edu.ph');

        $this->assertDatabaseHas('users', ['email' => 'teststudent@tpc.edu.ph']);
    }

    public function test_admin_cannot_create_duplicate_email(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'name'  => 'Duplicate',
                'email' => $this->student->email,
                'role'  => 'student',
            ])->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'The email has already been taken.');
    }

    public function test_admin_can_toggle_user_active_status(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/users/{$this->student->id}/toggle-active")
            ->assertOk();

        $this->assertFalse($this->student->fresh()->is_active);
    }

    public function test_admin_can_bulk_import_users(): void
    {
        Queue::fake();

        $emailContent = "newstudent1@tpc.edu.ph\nnewstudent2@tpc.edu.ph\nnewstudent3@tpc.edu.ph\n";
        $file         = UploadedFile::fake()->createWithContent('students.txt', $emailContent);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/users/bulk-import', [
                'file' => $file,
                'role' => 'student',
            ])->assertOk()
            ->assertJsonStructure(['results' => ['created', 'failed', 'skipped']]);

        $this->assertDatabaseHas('users', ['email' => 'newstudent1@tpc.edu.ph']);
        $this->assertDatabaseHas('users', ['email' => 'newstudent2@tpc.edu.ph']);
    }

    public function test_admin_can_update_user(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/admin/users/{$this->student->id}", [
                'name' => 'Updated Name',
            ])->assertOk()
            ->assertJsonPath('data.name', 'Updated Name');
    }

    public function test_admin_can_delete_student(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$this->student->id}")
            ->assertOk();

        $this->assertSoftDeleted('users', ['id' => $this->student->id]);
    }

    public function test_admin_cannot_delete_self(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$this->admin->id}")
            ->assertStatus(422);
    }
}
