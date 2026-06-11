<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return Inertia::render('Faculty/Profile', [
            'profile'  => $request->user()
                            ->append('profile_photo_url')
                            ->load('facultyProfile'),
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