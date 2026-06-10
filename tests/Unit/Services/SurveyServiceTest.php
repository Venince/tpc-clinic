<?php

namespace Tests\Unit\Services;

use App\Models\Role;
use App\Models\SurveyQuestion;
use App\Models\User;
use App\Services\AuditService;
use App\Services\SurveyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SurveyServiceTest extends TestCase
{
    use RefreshDatabase;

    private SurveyService $service;
    private User $admin;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SurveyService(new AuditService());
        $adminRole     = Role::where('name', 'admin')->firstOrFail();
        $studentRole   = Role::where('name', 'student')->firstOrFail();
        $this->admin   = User::factory()->create(['role_id' => $adminRole->id, 'force_password_change' => false]);
        $this->student = User::factory()->create(['role_id' => $studentRole->id, 'force_password_change' => false]);
    }

    public function test_admin_can_create_survey_question(): void
    {
        $question = $this->service->createQuestion([
            'question'    => 'Do you have allergies?',
            'type'        => 'radio',
            'options'     => ['Yes', 'No'],
            'is_required' => true,
        ], $this->admin->id);

        $this->assertDatabaseHas('survey_questions', ['question' => 'Do you have allergies?']);
        $this->assertEquals(1, $question->sort_order);
    }

    public function test_questions_get_sequential_sort_order(): void
    {
        $this->service->createQuestion(['question' => 'Q1', 'type' => 'text', 'is_required' => false], $this->admin->id);
        $q2 = $this->service->createQuestion(['question' => 'Q2', 'type' => 'text', 'is_required' => false], $this->admin->id);

        $this->assertEquals(2, $q2->sort_order);
    }

    public function test_student_can_submit_survey_answers(): void
    {
        $q1 = SurveyQuestion::create(['question' => 'Q1', 'type' => 'radio', 'options' => ['Yes', 'No'], 'is_required' => true, 'sort_order' => 1, 'is_active' => true]);
        $q2 = SurveyQuestion::create(['question' => 'Q2', 'type' => 'text', 'is_required' => false, 'sort_order' => 2, 'is_active' => true]);

        $this->service->submitAnswers($this->student->id, [
            $q1->id => 'Yes',
            $q2->id => 'No known allergies',
        ]);

        $this->assertDatabaseHas('survey_answers', [
            'user_id'            => $this->student->id,
            'survey_question_id' => $q1->id,
        ]);
    }

    public function test_reorder_questions(): void
    {
        $q1 = SurveyQuestion::create(['question' => 'First',  'type' => 'text', 'sort_order' => 1, 'is_active' => true, 'is_required' => false]);
        $q2 = SurveyQuestion::create(['question' => 'Second', 'type' => 'text', 'sort_order' => 2, 'is_active' => true, 'is_required' => false]);

        $this->service->reorder([$q2->id, $q1->id], $this->admin->id);

        $this->assertEquals(1, $q2->fresh()->sort_order);
        $this->assertEquals(2, $q1->fresh()->sort_order);
    }

    public function test_delete_question(): void
    {
        $question = SurveyQuestion::create(['question' => 'To delete', 'type' => 'text', 'sort_order' => 1, 'is_active' => true, 'is_required' => false]);
        $this->service->deleteQuestion($question, $this->admin->id);
        $this->assertSoftDeleted('survey_questions', ['id' => $question->id]);
    }
}
