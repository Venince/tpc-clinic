<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SurveyQuestion;
use App\Services\SurveyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SurveyController extends Controller
{
    public function __construct(private SurveyService $surveyService) {}

    public function index(): JsonResponse
    {
        $questions = SurveyQuestion::withCount('answers')->orderBy('sort_order')->get();
        return response()->json(['data' => $questions]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'question'    => ['required', 'string', 'max:500'],
            'type'        => ['required', Rule::in(['text', 'paragraph', 'radio', 'checkbox', 'dropdown', 'date'])],
            'options'     => ['nullable', 'array'],
            'options.*'   => ['string', 'max:255'],
            'is_required' => ['boolean'],
        ]);

        $question = $this->surveyService->createQuestion($data, $request->user()->id);
        return response()->json(['message' => 'Question created.', 'data' => $question], 201);
    }

    public function update(Request $request, SurveyQuestion $surveyQuestion): JsonResponse
    {
        $data = $request->validate([
            'question'    => ['sometimes', 'string', 'max:500'],
            'type'        => ['sometimes', Rule::in(['text', 'paragraph', 'radio', 'checkbox', 'dropdown', 'date'])],
            'options'     => ['nullable', 'array'],
            'is_required' => ['sometimes', 'boolean'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        $question = $this->surveyService->updateQuestion($surveyQuestion, $data, $request->user()->id);
        return response()->json(['message' => 'Question updated.', 'data' => $question]);
    }

    public function destroy(Request $request, SurveyQuestion $surveyQuestion): JsonResponse
    {
        $this->surveyService->deleteQuestion($surveyQuestion, $request->user()->id);
        return response()->json(['message' => 'Question deleted.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate(['order' => ['required', 'array'], 'order.*' => ['integer', 'exists:survey_questions,id']]);
        $this->surveyService->reorder($request->order, $request->user()->id);
        return response()->json(['message' => 'Questions reordered.']);
    }

    public function responses(Request $request): JsonResponse
    {
        $answers = \App\Models\SurveyAnswer::with(['user:id,name,email', 'question'])
            ->when($request->question_id, fn($q) => $q->where('survey_question_id', $request->question_id))
            ->paginate(50);
        return response()->json(['data' => $answers]);
    }
}
