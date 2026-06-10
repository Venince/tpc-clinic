<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(private AuditService $auditService) {}

    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->studentProfile()->with('program')->first();
        return response()->json(['data' => $profile]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'birth_date'       => ['nullable', 'date', 'before:today'],
            'sex'              => ['nullable', 'in:male,female,other'],
            'contact_number'   => ['nullable', 'string', 'max:20'],
            'address'          => ['nullable', 'string'],
            'guardian_name'    => ['nullable', 'string', 'max:255'],
            'guardian_contact' => ['nullable', 'string', 'max:20'],
            'civil_status'     => ['nullable', 'in:single,married,widowed,separated'],
        ]);

        $old     = $request->user()->studentProfile?->toArray();
        $profile = StudentProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            $data
        );

        $this->auditService->log('profile_updated', $request->user()->id, 'StudentProfile', $profile->id, $old, $data);
        return response()->json(['message' => 'Profile updated.', 'data' => $profile->load('program')]);
    }
}
