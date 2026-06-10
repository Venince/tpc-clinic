<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClinicService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class ClinicServiceController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'icon'        => ['required', 'string', 'max:100'],
            'tag'         => ['required', 'string', 'max:100'],
            'tag_type'    => ['required', 'in:available,urgent,info'],
            'is_active'   => ['boolean'],
        ]);

        $data['sort_order'] = ClinicService::max('sort_order') + 1;
        ClinicService::create($data);

        return back()->with('success', 'Service added.');
    }

    public function update(Request $request, ClinicService $clinicService): RedirectResponse
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'icon'        => ['required', 'string', 'max:100'],
            'tag'         => ['required', 'string', 'max:100'],
            'tag_type'    => ['required', 'in:available,urgent,info'],
            'is_active'   => ['boolean'],
        ]);

        $clinicService->update($data);

        return back()->with('success', 'Service updated.');
    }

    public function destroy(ClinicService $clinicService): RedirectResponse
    {
        $clinicService->delete();
        return back()->with('success', 'Service deleted.');
    }
}