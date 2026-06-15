<?php
namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return md5_file(public_path('build/manifest.json')) ?: null;
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        // Compute onboarding status for students only
        $onboarding = null;
        if ($user && optional($user->role)->name === 'student') {
            $profile    = $user->studentProfile;
            $profileOk  = $profile
                && $profile->student_id
                && $profile->program_id
                && $profile->year_level
                && $profile->sex
                && $profile->birth_date
                && $profile->contact_number;

            $surveyOk = false;
            if ($profileOk) {
                $requiredIds = \App\Models\SurveyQuestion::where('is_active', true)
                    ->where('is_required', true)
                    ->where('target_role', 'student')
                    ->pluck('id');
                if ($requiredIds->isEmpty()) {
                    $surveyOk = true;
                } else {
                    $answered = \App\Models\SurveyAnswer::where('user_id', $user->id)
                        ->whereIn('survey_question_id', $requiredIds)
                        ->whereNotNull('answer')
                        ->pluck('survey_question_id');
                    $surveyOk = $requiredIds->diff($answered)->isEmpty();
                }
            }

            $requiredTypeIds = \App\Models\RequirementType::where('is_active', true)
                ->where('is_required', true)
                ->where(function ($q) use ($profile) {
                    $q->whereNull('program_id')
                    ->orWhere('program_id', $profile?->program_id);
                })
                ->where(function ($q) use ($profile) {
                    $q->whereNull('year_level')
                    ->orWhere('year_level', $profile?->year_level);
                })
                ->pluck('id');

            $requirementsOk = true;
            if ($requiredTypeIds->isNotEmpty()) {
                $uploadedTypeIds = \App\Models\UserRequirement::where('user_id', $user->id)
                    ->whereIn('requirement_type_id', $requiredTypeIds)
                    ->whereNotNull('file_path')
                    ->pluck('requirement_type_id');
                $requirementsOk = $requiredTypeIds->diff($uploadedTypeIds)->isEmpty();
            }

            $onboarding = [
                'profile_completed'      => (bool) $profileOk,
                'survey_completed'       => $surveyOk,
                'requirements_completed' => $requirementsOk,  // ← new
                'done'                   => $profileOk && $surveyOk && $requirementsOk,
            ];
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id'                    => $user->id,
                    'name'                  => $user->name,
                    'email'                 => $user->email,
                    'role' => $user->role ? [
                        'name'              => $user->role->name,
                        'display_name'      => $user->role->display_name,
                    ] : null,
                    'force_password_change' => $user->force_password_change,
                    'profile_photo_url'     => $user->profile_photo_url,
                ] : null,
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error'   => fn() => $request->session()->get('error'),
            ],
            'ziggy' => fn() => [
                ...(new \Tighten\Ziggy\Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'notifications' => fn() => $user ? [
                'unread_count' => $user->unreadNotifications()->count(),
                'latest'       => $user->notifications()->limit(8)->get()->map(fn($n) => [
                    'id'         => $n->id,
                    'data'       => $n->data,
                    'read_at'    => $n->read_at,
                    'created_at' => $n->created_at,
                ]),
            ] : null,
            'onboarding' => $onboarding,   // ← only new line in the return
        ]);
    }
}