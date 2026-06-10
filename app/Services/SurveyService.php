<?php

namespace App\Services;

use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use Illuminate\Validation\ValidationException;

class SurveyService
{
    public function __construct(private AuditService $auditService) {}

    public function createQuestion(array $data, int $adminId): SurveyQuestion
    {
        $data['sort_order'] = SurveyQuestion::max('sort_order') + 1;
        $question = SurveyQuestion::create($data);
        $this->auditService->log('survey_question_created', $adminId, 'SurveyQuestion', $question->id);
        return $question;
    }

    public function updateQuestion(SurveyQuestion $question, array $data, int $adminId): SurveyQuestion
    {
        $old = $question->toArray();
        $question->update($data);
        $this->auditService->log('survey_question_updated', $adminId, 'SurveyQuestion', $question->id, $old, $data);
        return $question->fresh();
    }

    public function deleteQuestion(SurveyQuestion $question, int $adminId): void
    {
        $this->auditService->log('survey_question_deleted', $adminId, 'SurveyQuestion', $question->id);
        $question->delete();
    }

    public function reorder(array $orderedIds, int $adminId): void
    {
        foreach ($orderedIds as $index => $id) {
            SurveyQuestion::where('id', $id)->update(['sort_order' => $index + 1]);
        }
        $this->auditService->log('survey_reordered', $adminId);
    }

    public function submitAnswers(int $userId, array $answers): void
    {
        $questions = SurveyQuestion::where('is_active', true)->get()->keyBy('id');

        foreach ($answers as $questionId => $answer) {
            if (!isset($questions[$questionId])) {
                throw ValidationException::withMessages([
                    "answers.{$questionId}" => ["Question {$questionId} does not exist."],
                ]);
            }

            SurveyAnswer::updateOrCreate(
                ['user_id' => $userId, 'survey_question_id' => $questionId],
                ['answer' => is_array($answer) ? $answer : [$answer]]
            );
        }

        // Check required questions
        $requiredIds = $questions->where('is_required', true)->pluck('id');
        $answeredIds = SurveyAnswer::where('user_id', $userId)->pluck('survey_question_id');
        $missing     = $requiredIds->diff($answeredIds);

        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages([
                'answers' => ['Please answer all required questions.'],
            ]);
        }

        $this->auditService->log('survey_submitted', $userId);
    }

    public function getUserAnswers(int $userId): array
    {
        $questions = SurveyQuestion::where('is_active', true)->orderBy('sort_order')->get();
        $answers   = SurveyAnswer::where('user_id', $userId)->get()->keyBy('survey_question_id');

        return $questions->map(function ($q) use ($answers) {
            return [
                'question' => $q,
                'answer'   => $answers->get($q->id)?->answer,
            ];
        })->toArray();
    }
}
