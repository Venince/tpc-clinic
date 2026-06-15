<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SurveyQuestion;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SurveyController extends Controller
{
    public function index(Request $request)
    {
        $roleTab = $request->get('role_tab', 'student');

        $questions = SurveyQuestion::withCount('answers')
            ->where('target_role', $roleTab)
            ->orderBy('sort_order')
            ->get();

        $responses = \App\Models\User::with([
                'role',
                'studentProfile.program',
                'facultyProfile',
                'surveyAnswers' => fn($q) => $q->whereHas('question', fn($sq) => $sq->where('target_role', $roleTab)),
                'surveyAnswers.question',
            ])
            ->whereHas('role', fn($q) => $q->where('name', $roleTab))
            ->whereHas('surveyAnswers', fn($q) => $q->whereHas('question', fn($sq) => $sq->where('target_role', $roleTab)))
            ->withCount(['surveyAnswers as survey_answers_count' => fn($q) => $q->whereHas('question', fn($sq) => $sq->where('target_role', $roleTab))])
            ->when($request->search, fn($q) => $q->where(fn($s) =>
                $s->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
            ))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Survey/Index', [
            'questions' => $questions,
            'responses' => $responses,
            'filters'   => $request->only('search', 'role_tab'),
            'role_tab'  => $roleTab,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'question'    => ['required', 'string', 'max:500'],
            'type'        => ['required', Rule::in(['text', 'paragraph', 'radio', 'checkbox', 'dropdown', 'date'])],
            'options'     => ['nullable', 'array'],
            'is_required' => ['boolean'],
            'target_role' => ['required', Rule::in(['student', 'faculty_staff'])],
        ]);

        $data['sort_order'] = SurveyQuestion::where('target_role', $data['target_role'])->max('sort_order') + 1;

        SurveyQuestion::create($data);

        return back()->with('success', 'Question added.');
    }

    public function update(Request $request, SurveyQuestion $surveyQuestion)
    {
        $data = $request->validate([
            'question'    => ['sometimes', 'string', 'max:500'],
            'type'        => ['sometimes', Rule::in(['text', 'paragraph', 'radio', 'checkbox', 'dropdown', 'date'])],
            'options'     => ['nullable', 'array'],
            'is_required' => ['boolean'],
            'is_active'   => ['boolean'],
        ]);

        $surveyQuestion->update($data);

        return back()->with('success', 'Question updated.');
    }

    public function destroy(SurveyQuestion $surveyQuestion)
    {
        $surveyQuestion->delete();
        return back()->with('success', 'Question deleted.');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'order'   => ['required', 'array'],
            'order.*' => ['integer', 'exists:survey_questions,id'],
        ]);

        foreach ($request->order as $i => $id) {
            SurveyQuestion::where('id', $id)->update(['sort_order' => $i + 1]);
        }

        return back()->with('success', 'Questions reordered.');
    }
}