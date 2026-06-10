<?php

namespace App\Http\Middleware;

use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use Closure;
use Illuminate\Http\Request;

class EnsureSurveyCompleted
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Only enforce for students
        if (!$user || $user->role->name !== 'student') {
            return $next($request);
        }

        // If no active survey questions exist, don't block
        $hasQuestions = SurveyQuestion::where('is_active', true)->exists();
        if (!$hasQuestions) {
            return $next($request);
        }

        // Check if student has answered at least once
        $completed = SurveyAnswer::where('user_id', $user->id)->exists();

        if (!$completed) {
            return redirect()
                ->route('student.survey.index')
                ->with('error', 'Please complete the health survey before using other features.');
        }

        return $next($request);
    }
}