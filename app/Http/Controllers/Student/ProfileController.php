<?php
namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return Inertia::render('Student/Profile', [
            'profile'  => $request->user()->load('studentProfile.program'),
            'programs' => Program::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'                => ['required', 'string', 'max:255'],
            'student_id'          => ['nullable', 'string', 'max:50'],
            'program_id'          => ['nullable', 'exists:programs,id'],
            'year_level'          => ['nullable', 'integer', 'min:1', 'max:6'],
            'block'               => ['nullable', 'string', 'max:10'],
            'birth_date'          => ['nullable', 'date', 'before:today'],
            'sex'                 => ['nullable', 'in:male,female,other'],
            'contact_number'      => ['nullable', 'string', 'max:20'],
            'address'             => ['nullable', 'string'],
            'guardian_name'       => ['nullable', 'string', 'max:255'],
            'guardian_contact'    => ['nullable', 'string', 'max:20'],
            'civil_status'        => ['nullable', 'in:single,married,widowed,separated'],
            'is_pregnant'         => ['boolean'],
            'pregnancy_due_date'  => ['nullable', 'date', 'after:today', 'required_if:is_pregnant,true'],
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

        return back()->with('success', 'Profile updated successfully.');
    }
}