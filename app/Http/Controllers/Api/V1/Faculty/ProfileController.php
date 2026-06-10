<?php
namespace App\Http\Controllers\Api\V1\Faculty;
use App\Http\Controllers\Controller;
use App\Models\FacultyProfile;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(private AuditService $auditService) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->facultyProfile]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'birth_date'     => ['nullable', 'date', 'before:today'],
            'sex'            => ['nullable', 'in:male,female,other'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'address'        => ['nullable', 'string'],
            'civil_status'   => ['nullable', 'in:single,married,widowed,separated'],
        ]);

        $profile = FacultyProfile::updateOrCreate(['user_id' => $request->user()->id], $data);
        $this->auditService->log('profile_updated', $request->user()->id, 'FacultyProfile', $profile->id);
        return response()->json(['message' => 'Profile updated.', 'data' => $profile]);
    }
}
