<?php

namespace App\Http\Middleware;

use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use Closure;
use Illuminate\Http\Request;

class EnsureProfileCompleted
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $role = $user->role->name;

        // ── Student ────────────────────────────────────────────────────────
        if ($role === 'student') {

            // 1. Check profile first
            $profile   = $user->studentProfile;
            $profileOk = $profile
                && $profile->student_id
                && $profile->program_id
                && $profile->year_level
                && $profile->sex
                && $profile->birth_date
                && $profile->contact_number;

            if (!$profileOk) {
                return redirect()
                    ->route('student.profile')
                    ->with('error', 'Please complete your profile before using other features.');
            }

          // Profile done — check survey next,
          // but don't block if they're already on the survey page
          if (!$request->routeIs('student.survey.*')) {
              $requiredQuestionIds = SurveyQuestion::where('is_active', true)
                  ->where('is_required', true)
                  ->pluck('id');

              if ($requiredQuestionIds->isNotEmpty()) {
                  $answeredIds = SurveyAnswer::where('user_id', $user->id)
                      ->whereIn('survey_question_id', $requiredQuestionIds)
                      ->whereNotNull('answer')
                      ->get()
                      ->filter(fn($a) => !empty(array_filter((array) $a->answer, fn($v) => trim($v) !== '')))
                      ->pluck('survey_question_id');

                  $allRequiredAnswered = $requiredQuestionIds->diff($answeredIds)->isEmpty();

                  if (!$allRequiredAnswered) {
                      return redirect()
                          ->route('student.survey.index')
                          ->with('error', 'Please complete all required health survey questions before using other features.');
                  }
              }
          }
        }

        // ── Faculty ────────────────────────────────────────────────────────
        if ($role === 'faculty_staff') {
            $profile   = $user->facultyProfile;
            $profileOk = $profile
                && $profile->department
                && $profile->position
                && $profile->contact_number;

            if (!$profileOk) {
                return redirect()
                    ->route('faculty.profile')
                    ->with('error', 'Please complete your profile before using other features.');
            }
        }

        return $next($request);
    }
}
