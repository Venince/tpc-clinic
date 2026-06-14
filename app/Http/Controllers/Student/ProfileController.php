<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\StudentProfile;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return Inertia::render('Student/Profile', [
            'profile'  => $request->user()
                            ->append('profile_photo_url')
                            ->load('studentProfile.program'),
            'programs' => Program::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'               => ['required', 'string', 'max:255'],
            'student_id'         => [
                'required', 'string', 'max:50',
                // Unique across student_profiles, ignoring this user's own row
                Rule::unique('student_profiles', 'student_id')
                    ->where(fn($q) => $q->where('user_id', '!=', $user->id)),
            ],
            'program_id'         => ['required', 'exists:programs,id'],
            'year_level'         => ['required', 'integer', 'min:1', 'max:6'],
            'block'              => ['required', 'string', 'max:10'],
            'birth_date'         => ['required', 'date', 'before:today'],
            'sex'                => ['required', 'in:male,female,other'],
            'contact_number'     => ['required', 'string', 'max:20'],
            'address'            => ['required', 'string', 'max:500'],
            'guardian_name'      => ['required', 'string', 'max:255'],
            'guardian_contact'   => ['required', 'string', 'max:20'],
            'civil_status'       => ['required', 'in:single,married,widowed,separated'],
            'is_pregnant'        => ['boolean'],
            'pregnancy_due_date' => ['nullable', 'date', 'after:today', 'required_if:is_pregnant,true'],
        ]);

        $user->update(['name' => $request->name]);

        StudentProfile::updateOrCreate(
            ['user_id' => $user->id],
            $request->only([
                'student_id', 'program_id', 'year_level', 'block',
                'birth_date', 'sex', 'contact_number', 'address',
                'guardian_name', 'guardian_contact', 'civil_status',
                'is_pregnant', 'pregnancy_due_date',
            ])
        );

        $requiredIds = SurveyQuestion::where('is_active', true)
            ->where('is_required', true)
            ->pluck('id');

        $answeredIds = SurveyAnswer::where('user_id', $user->id)
            ->whereIn('survey_question_id', $requiredIds)
            ->whereNotNull('answer')
            ->get()
            ->filter(fn($a) => !empty(array_filter((array) $a->answer, fn($v) => trim($v) !== '')))
            ->pluck('survey_question_id');

        $surveyDone = $requiredIds->isEmpty() || $requiredIds->diff($answeredIds)->isEmpty();

        if ($surveyDone) {
            return redirect()->route('student.dashboard')
                ->with('success', 'Profile saved! Welcome to your dashboard.');
        }

        return back()->with('success', 'Profile updated successfully.');
    }

    public function uploadPhoto(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();

        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $path = $request->file('photo')->store('profile-photos', 'public');
        $user->update(['profile_photo_path' => $path]);

        return back()->with('success', 'Profile photo updated.');
    }

    public function deletePhoto(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
            $user->update(['profile_photo_path' => null]);
        }

        return back()->with('success', 'Profile photo removed.');
    }
}