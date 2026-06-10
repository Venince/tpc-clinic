<?php

namespace Tests\Feature\Admin;

use App\Models\Program;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminFeaturesTest extends TestCase
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

    private function createUserWithRole(string $role): User
    {
        $r = Role::where('name', $role)->firstOrFail();
        return User::factory()->create(['role_id' => $r->id, 'force_password_change' => false, 'is_active' => true]);
    }

    // ── Dashboard ─────────────────────────────────────────────
    public function test_admin_can_view_dashboard_stats(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/stats')
            ->assertOk()
            ->assertJsonStructure(['data' => ['users', 'appointments', 'medicine', 'pregnancy']]);
    }

    public function test_admin_can_view_appointment_chart(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/appointments-chart')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_admin_can_view_medicine_chart(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/medicine-chart')
            ->assertOk();
    }

    public function test_admin_can_view_pregnancy_stats(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/pregnancy-stats')
            ->assertOk()
            ->assertJsonStructure(['data' => ['students', 'faculty']]);
    }

    // ── Programs ─────────────────────────────────────────────
    public function test_admin_can_create_program(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/programs', [
                'code' => 'BSIT',
                'name' => 'Bachelor of Science in Information Technology',
            ])->assertStatus(201)
            ->assertJsonPath('data.code', 'BSIT');

        $this->assertDatabaseHas('programs', ['code' => 'BSIT']);
    }

    public function test_admin_cannot_create_duplicate_program_code(): void
    {
        Program::create(['code' => 'BSIT', 'name' => 'BS Info Tech', 'is_active' => true]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/programs', [
                'code' => 'BSIT',
                'name' => 'Another BSIT',
            ])->assertStatus(422);
    }

    public function test_admin_can_update_program(): void
    {
        $program = Program::create(['code' => 'BSED', 'name' => 'BS Education', 'is_active' => true]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/admin/programs/{$program->id}", [
                'name' => 'Bachelor of Secondary Education',
            ])->assertOk()
            ->assertJsonPath('data.name', 'Bachelor of Secondary Education');
    }

    public function test_admin_can_delete_program_without_students(): void
    {
        $program = Program::create(['code' => 'TEMP', 'name' => 'Temp Program', 'is_active' => true]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/programs/{$program->id}")
            ->assertOk();

        $this->assertSoftDeleted('programs', ['id' => $program->id]);
    }

    public function test_student_cannot_create_program(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/admin/programs', [
                'code' => 'BSIT',
                'name' => 'BS IT',
            ])->assertStatus(403);
    }

    // ── Announcements ─────────────────────────────────────────
    public function test_admin_can_create_announcement(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/announcements', [
                'title'        => 'Clinic Hours Update',
                'content'      => 'The clinic will be open from 8AM-5PM.',
                'category'     => 'general',
                'is_published' => true,
            ])->assertStatus(201)
            ->assertJsonPath('data.title', 'Clinic Hours Update');
    }

    public function test_public_can_view_published_announcements(): void
    {
        \App\Models\Announcement::create([
            'created_by'   => $this->admin->id,
            'title'        => 'Public Announcement',
            'content'      => 'This is public.',
            'category'     => 'general',
            'is_published' => true,
            'published_at' => now()->subHour(),
        ]);

        $this->getJson('/api/v1/public/announcements')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_public_cannot_view_unpublished_announcements(): void
    {
        \App\Models\Announcement::create([
            'created_by'   => $this->admin->id,
            'title'        => 'Draft Announcement',
            'content'      => 'Not published.',
            'category'     => 'general',
            'is_published' => false,
        ]);

        $response = $this->getJson('/api/v1/public/announcements')->assertOk();
        $titles   = collect($response->json('data.data'))->pluck('title');
        $this->assertFalse($titles->contains('Draft Announcement'));
    }

    // ── Audit Logs ────────────────────────────────────────────
    public function test_super_admin_can_view_audit_logs(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs')
            ->assertOk();
    }

    public function test_admin_cannot_view_audit_logs(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs')
            ->assertStatus(403);
    }

    // ── Report Generation ─────────────────────────────────────
    public function test_admin_can_queue_report(): void
    {
        \Illuminate\Support\Facades\Queue::fake();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/reports/generate', [
                'type'   => 'student_health',
                'title'  => 'Test Report',
                'format' => 'pdf',
            ])->assertStatus(202)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('reports', ['type' => 'student_health', 'status' => 'pending']);
    }
}
