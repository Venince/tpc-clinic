<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\SurveyQuestion;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SurveyController extends Controller {
    public function index(Request $request) {
        $questions = SurveyQuestion::withCount('answers')->orderBy('sort_order')->get();

        $responses = \App\Models\User::with(['role', 'studentProfile.program', 'surveyAnswers.question'])
            ->whereHas('surveyAnswers')
            ->withCount('surveyAnswers')
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
            'filters'   => $request->only('search'),
        ]);
    }
    public function store(Request $request) {
        $data = $request->validate(['question'=>['required','string','max:500'],'type'=>['required',Rule::in(['text','paragraph','radio','checkbox','dropdown','date'])],'options'=>['nullable','array'],'is_required'=>['boolean']]);
        $data['sort_order'] = SurveyQuestion::max('sort_order') + 1;
        SurveyQuestion::create($data);
        return back()->with('success','Question added.');
    }
    public function update(Request $request, SurveyQuestion $surveyQuestion) {
        $data = $request->validate(['question'=>['sometimes','string','max:500'],'type'=>['sometimes',Rule::in(['text','paragraph','radio','checkbox','dropdown','date'])],'options'=>['nullable','array'],'is_required'=>['boolean'],'is_active'=>['boolean']]);
        $surveyQuestion->update($data);
        return back()->with('success','Question updated.');
    }
    public function destroy(SurveyQuestion $surveyQuestion) { $surveyQuestion->delete(); return back()->with('success','Question deleted.'); }
    public function reorder(Request $request) {
        $request->validate(['order'=>['required','array'],'order.*'=>['integer','exists:survey_questions,id']]);
        foreach ($request->order as $i => $id) SurveyQuestion::where('id',$id)->update(['sort_order'=>$i+1]);
        return back()->with('success','Questions reordered.');
    }
}
