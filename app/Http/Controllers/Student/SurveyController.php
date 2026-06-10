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
        $questions = SurveyQuestion::where('is_active',true)->orderBy('sort_order')->get();
        $answers   = SurveyAnswer::where('user_id',$request->user()->id)->get()->keyBy('survey_question_id');
        return Inertia::render($this->page($request), ['questions'=>$questions,'answers'=>$answers,'completed'=>$answers->isNotEmpty()]);
    }

    public function submit(Request $request)
    {
        $request->validate(['answers'=>['required','array']]);
        foreach ($request->answers as $questionId => $answer) {
            SurveyAnswer::updateOrCreate(
                ['user_id'=>$request->user()->id,'survey_question_id'=>$questionId],
                ['answer'=>is_array($answer)?$answer:[$answer]]
            );
        }
        return back()->with('success','Health survey submitted successfully.');
    }
}
