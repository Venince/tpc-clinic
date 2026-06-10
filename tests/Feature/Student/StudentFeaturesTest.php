<?php

namespace Tests\Feature\Student;

use App\Models\RequirementType;
use App\Models\Role;
use App\Models\SurveyQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StudentFeaturesTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->student = $this->createUserWithRole('student');
        $this->admin   = $this->createUserWithRole('admin');
    }

    private function createUserWithRole(string $role): User
    {
        $r = Role::where('name', $role)->firstOrFail();
        return User::factory()->create(['role_id' => $r->id, 'force_password_change' => false, 'is_active' => true]);
    }

    // ── Survey ─────────────────────────────────────────────
    public function test_student_can_view_survey_questions(): void
    {
        SurveyQuestion::create(['question' => 'Test Q', 'type' => 'radio', 'options' => ['Yes','No'], 'is_required' => true, 'sort_order' => 1, 'is_active' => true]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/survey/questions')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'question', 'type']]]);
    }

    public function test_student_can_submit_survey(): void
    {
        $q1 = SurveyQuestion::create(['question' => 'Q1', 'type' => 'radio', 'options' => ['Yes','No'], 'is_required' => true, 'sort_order' => 1, 'is_active' => true]);
        $q2 = SurveyQuestion::create(['question' => 'Q2', 'type' => 'text', 'is_required' => false, 'sort_order' => 2, 'is_active' => true]);

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/survey/submit', [
                'answers' => [$q1->id => 'Yes', $q2->id => 'No issues'],
            ])->assertOk()
            ->assertJsonPath('message', 'Survey submitted successfully.');

        $this->assertDatabaseHas('survey_answers', [
            'user_id' => $this->student->id,
            'survey_question_id' => $q1->id,
        ]);
    }

    public function test_student_can_view_their_answers(): void
    {
        $q = SurveyQuestion::create(['question' => 'Q', 'type' => 'text', 'is_required' => false, 'sort_order' => 1, 'is_active' => true]);

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/survey/submit', ['answers' => [$q->id => 'My answer']]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/survey/my-answers')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    // ── Requirements ─────────────────────────────────────────
    public function test_student_can_view_requirement_status(): void
    {
        RequirementType::create(['name' => 'Drug Test', 'is_active' => true, 'sort_order' => 1]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/requirements')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_student_can_upload_requirement(): void
    {
        Storage::fake('private');

        $type = RequirementType::create(['name' => 'Medical Cert', 'is_active' => true, 'sort_order' => 1]);
        $file = UploadedFile::fake()->create('medical.pdf', 500, 'application/pdf');

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/requirements/upload', [
                'requirement_type_id' => $type->id,
                'file'                => $file,
            ])->assertStatus(201)
            ->assertJsonPath('data.verification_status', 'pending');

        $this->assertDatabaseHas('user_requirements', [
            'user_id'             => $this->student->id,
            'requirement_type_id' => $type->id,
            'approval_status'     => 'pending',
        ]);
    }

    public function test_student_cannot_upload_invalid_file_type(): void
    {
        Storage::fake('private');
        $type = RequirementType::create(['name' => 'Drug Test', 'is_active' => true, 'sort_order' => 1]);
        $file = UploadedFile::fake()->create('malware.exe', 100, 'application/octet-stream');

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/requirements/upload', [
                'requirement_type_id' => $type->id,
                'file'                => $file,
            ])->assertStatus(422);
    }

    public function test_admin_can_review_requirement(): void
    {
        Storage::fake('private');
        $type = RequirementType::create(['name' => 'Vaccination Card', 'is_active' => true, 'sort_order' => 1]);
        $file = UploadedFile::fake()->create('vax.pdf', 300, 'application/pdf');

        $uploadResponse = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/requirements/upload', [
                'requirement_type_id' => $type->id,
                'file'                => $file,
            ]);

        $requirementId = $uploadResponse->json('data.id');

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/user-requirements/{$requirementId}/review", [
                'status' => 'approved',
            ])->assertOk()
            ->assertJsonPath('data.approval_status', 'approved');
    }

    // ── Profile ─────────────────────────────────────────────
    public function test_student_can_update_profile(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->putJson('/api/v1/student/profile', [
                'contact_number' => '09171234567',
                'address'        => 'Talibon, Bohol',
                'civil_status'   => 'single',
            ])->assertOk()
            ->assertJsonPath('data.contact_number', '09171234567');
    }

    public function test_student_can_view_their_profile(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/profile')
            ->assertOk();
    }

    // ── Role Isolation ────────────────────────────────────────
    public function test_student_cannot_access_admin_endpoints(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/stats')
            ->assertStatus(403);
    }

    public function test_faculty_routes_require_faculty_role(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/faculty/profile')
            ->assertStatus(403);
    }
}
