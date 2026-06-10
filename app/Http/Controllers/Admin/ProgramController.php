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
                'studentProfiles.user' => fn($q) => $q->select('id', 'name', 'email', 'is_active', 'last_login_at'),
            ])
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Programs/Index', ['programs' => $programs]);
    }
    public function store(Request $request) {
        $request->validate(['code'=>['required','string','max:20','unique:programs,code'],'name'=>['required','string','max:255'],'description'=>['nullable','string']]);
        Program::create($request->only('code','name','description'));
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
}
