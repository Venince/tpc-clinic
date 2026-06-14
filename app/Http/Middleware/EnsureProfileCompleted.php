<?php
namespace App\Http\Middleware;

use App\Models\RequirementType;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use App\Models\UserRequirement;
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

            // 1. Profile check
            $profile   = $user->studentProfile;
            $profileOk = $profile
                && $profile->student_id
                && $profile->program_id
                && $profile->year_level
                && $profile->sex
                && $profile->birth_date
                && $profile->contact_number;

            // 2. Survey check
            $requiredQuestionIds = SurveyQuestion::where('is_active', true)
                ->where('is_required', true)
                ->pluck('id');

            $surveyOk = true;
            if ($requiredQuestionIds->isNotEmpty()) {
                $answeredIds = SurveyAnswer::where('user_id', $user->id)
                    ->whereIn('survey_question_id', $requiredQuestionIds)
                    ->whereNotNull('answer')
                    ->get()
                    ->filter(fn($a) => !empty(array_filter((array) $a->answer, fn($v) => trim($v) !== '')))
                    ->pluck('survey_question_id');
                $surveyOk = $requiredQuestionIds->diff($answeredIds)->isEmpty();
            }

            // 3. Requirements check — student must upload ALL required active types
            $requiredTypeIds = RequirementType::where('is_active', true)
                ->where('is_required', true)
                ->pluck('id');

            $requirementsOk = true;
            if ($requiredTypeIds->isNotEmpty()) {
                $uploadedTypeIds = UserRequirement::where('user_id', $user->id)
                    ->whereIn('requirement_type_id', $requiredTypeIds)
                    ->whereNotNull('file_path')
                    ->pluck('requirement_type_id');
                $requirementsOk = $requiredTypeIds->diff($uploadedTypeIds)->isEmpty();
            }

            // Block on whichever is incomplete — but don't redirect away from those pages
            if (!$profileOk && !$request->routeIs('student.profile', 'student.profile.*')) {
                return redirect()->route('student.profile')
                    ->with('error', 'Please complete your profile before using other features.');
            }

            if (!$surveyOk && !$request->routeIs('student.survey.*')) {
                return redirect()->route('student.survey.index')
                    ->with('error', 'Please complete the health survey before using other features.');
            }

            if (!$requirementsOk && !$request->routeIs('student.requirements.*')) {
                return redirect()->route('student.requirements.index')
                    ->with('error', 'Please upload all required documents before using other features.');
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
                return redirect()->route('faculty.profile')
                    ->with('error', 'Please complete your profile before using other features.');
            }
        }

        return $next($request);
    }
}