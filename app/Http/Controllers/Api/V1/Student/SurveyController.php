<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\SurveyQuestion;
use App\Services\SurveyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SurveyController extends Controller
{
    public function __construct(private SurveyService $surveyService) {}

    public function questions(): JsonResponse
    {
        $questions = SurveyQuestion::where('is_active', true)->orderBy('sort_order')->get(['id', 'question', 'type', 'options', 'is_required']);
        return response()->json(['data' => $questions]);
    }

    public function myAnswers(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->surveyService->getUserAnswers($request->user()->id)]);
    }

    public function submit(Request $request): JsonResponse
    {
        $request->validate(['answers' => ['required', 'array']]);
        $this->surveyService->submitAnswers($request->user()->id, $request->answers);
        return response()->json(['message' => 'Survey submitted successfully.']);
    }
}
