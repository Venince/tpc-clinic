<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProgramController extends Controller {
    public function index() {
        $programs = Program::withCount('studentProfiles')
            ->with([
                'studentProfiles' => fn($q) => $q->select('id', 'user_id', 'program_id', 'student_id', 'year_level', 'block', 'is_pregnant'),
                'studentProfiles.user' => fn($q) => $q->select('id', 'name', 'email', 'is_active', 'last_login_at', 'profile_photo_path'),
            ])
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Programs/Index', ['programs' => $programs]);
    }
    public function store(Request $request) {
        $request->validate([
            'code' => ['required','string','max:20', Rule::unique('programs','code')->whereNull('deleted_at')],
            'name' => ['required','string','max:255'],
            'description' => ['nullable','string'],
        ]);

        $trashed = Program::withTrashed()->where('code', $request->code)->first();
        if ($trashed) {
            $trashed->restore();
            $trashed->update($request->only('name','description'));
        } else {
            Program::create($request->only('code','name','description'));
        }

        return back()->with('success','Program created.');
    }
    public function update(Request $request, Program $program) {
        $request->validate(['code'=>['required','string','max:20',Rule::unique('programs')->ignore($program->id)],'name'=>['required','string','max:255'],'description'=>['nullable','string'],'is_active'=>['boolean']]);
        $program->update($request->only('code','name','description','is_active'));
        return back()->with('success','Program updated.');
    }
    public function destroy(Program $program) {
        if ($program->studentProfiles()->exists()) return back()->with('error','Cannot delete program with enrolled students.');
        $program->delete();
        return back()->with('success','Program deleted.');
    }

    public function showStudent(\App\Models\StudentProfile $studentProfile)
    {
        $studentProfile->load([
            'user' => fn($q) => $q->select('id','name','email','is_active','last_login_at','profile_photo_path','created_at'),
            'program:id,code,name',
        ]);

        $user = $studentProfile->user;

        $appointments = $user->appointments()
            ->with('slot')
            ->latest()
            ->get();

        $medicineRequests = $user->medicineRequests()
            ->with(['medicine:id,name,unit', 'reviewer:id,name'])
            ->latest()
            ->get();

        $surveyAnswers = $user->surveyAnswers()
            ->with('question')
            ->get();

        $requirements = $user->requirements()
            ->with(['requirementType:id,name', 'reviewer:id,name'])
            ->latest()
            ->get();

        return Inertia::render('Admin/Programs/StudentShow', [
            'student' => $studentProfile,
            'appointments' => $appointments,
            'medicineRequests' => $medicineRequests,
            'surveyAnswers' => $surveyAnswers,
            'requirements' => $requirements,
        ]);
    }

    public function showFaculty(\App\Models\FacultyProfile $facultyProfile)
    {
        $facultyProfile->load([
            'user' => fn($q) => $q->select('id','name','email','is_active','last_login_at','profile_photo_path','created_at'),
        ]);

        $user = $facultyProfile->user;

        $appointments = $user->appointments()
            ->with('slot')
            ->latest()
            ->get();

        $medicineRequests = $user->medicineRequests()
            ->with(['medicine:id,name,unit', 'reviewer:id,name'])
            ->latest()
            ->get();

        $surveyAnswers = $user->surveyAnswers()
            ->with('question')
            ->get();

        $requirements = $user->requirements()
            ->with(['requirementType:id,name', 'reviewer:id,name'])
            ->latest()
            ->get();

        return Inertia::render('Admin/Faculty/Show', [
            'faculty' => $facultyProfile,
            'appointments' => $appointments,
            'medicineRequests' => $medicineRequests,
            'surveyAnswers' => $surveyAnswers,
            'requirements' => $requirements,
        ]);
    }
}
