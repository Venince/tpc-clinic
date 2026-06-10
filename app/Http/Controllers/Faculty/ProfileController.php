<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return Inertia::render('Faculty/Profile', [
            'profile'  => $request->user()->load('facultyProfile'),
            'programs' => \App\Models\Program::orderBy('name')->get(['id', 'name']),
        ]);
    }
    public function update(Request $request)
    {
        $data = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'position'   => ['nullable', 'string', 'max:255'],
            'phone'      => ['nullable', 'string', 'max:50'],
        ]);

        $request->user()->update(['name' => $data['name']]);
        $request->user()->facultyProfile()->updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'department'      => $data['department'],
                'position'        => $data['position'],
                'contact_number'  => $data['phone'],
            ]
        );

        return back()->with('success', 'Profile updated.');
    }
}