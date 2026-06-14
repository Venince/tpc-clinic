<?php
namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyController extends Controller
{
    private function page(Request $request): string
    {
        return $request->user()->role->name === 'student' ? 'Student/Survey/Index' : 'Faculty/Survey/Index';
    }

    public function index(Request $request)
    {
        $questions = SurveyQuestion::where('is_active', true)->orderBy('sort_order')->get();
        $answers   = SurveyAnswer::where('user_id', $request->user()->id)->get()->keyBy('survey_question_id');

        $requiredIds = SurveyQuestion::where('is_active', true)
            ->where('is_required', true)
            ->pluck('id');

        $answeredRequiredIds = $answers
            ->whereIn('survey_question_id', $requiredIds)
            ->filter(fn($a) => !empty(array_filter((array) $a->answer, fn($v) => trim($v) !== '')))
            ->pluck('survey_question_id');

        return Inertia::render($this->page($request), [
            'questions' => $questions,
            'answers'   => $answers,
            'completed' => $requiredIds->isEmpty() || $requiredIds->diff($answeredRequiredIds)->isEmpty(),
        ]);
    }

    public function submit(Request $request)
    {
        $request->validate(['answers' => ['required', 'array']]);

        $requiredQuestions = SurveyQuestion::where('is_active', true)
            ->where('is_required', true)
            ->get();

        $errors = [];
        foreach ($requiredQuestions as $q) {
            $answer = $request->answers[$q->id] ?? null;
            $isEmpty = is_null($answer)
                || (is_array($answer) && empty(array_filter($answer, fn($v) => trim($v) !== '')))
                || (is_string($answer) && trim($answer) === '');

            if ($isEmpty) {
                $errors["answers.{$q->id}"] = "Question \"{$q->question}\" is required.";
            }
        }

        if (!empty($errors)) {
            return back()->withErrors($errors)->withInput();
        }

        foreach ($request->answers as $questionId => $answer) {
            SurveyAnswer::updateOrCreate(
                ['user_id' => $request->user()->id, 'survey_question_id' => $questionId],
                ['answer'  => is_array($answer) ? $answer : [$answer]]
            );
        }

        // If profile is also complete, redirect to dashboard
        $user    = $request->user();
        $profile = $user->studentProfile;
        $profileOk = $profile
            && $profile->student_id
            && $profile->program_id
            && $profile->year_level
            && $profile->block
            && $profile->sex
            && $profile->birth_date
            && $profile->contact_number
            && $profile->address
            && $profile->guardian_name
            && $profile->guardian_contact
            && $profile->civil_status;

        if ($profileOk) {
            return redirect()->route('student.dashboard')
                ->with('success', 'Health survey submitted! Welcome to your dashboard.');
        }

        return back()->with('success', 'Health survey submitted. Please complete your profile to access all features.');
    }
}
