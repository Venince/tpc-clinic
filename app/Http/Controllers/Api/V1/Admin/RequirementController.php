<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\RequirementType;
use App\Models\UserRequirement;
use App\Services\RequirementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RequirementController extends Controller
{
    public function __construct(private RequirementService $requirementService) {}

    public function indexTypes(): JsonResponse
    {
        $types = RequirementType::withCount('userRequirements')->orderBy('sort_order')->get();
        return response()->json(['data' => $types]);
    }

    public function storeType(Request $request): JsonResponse
    {
        $data    = $request->validate(['name' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string']]);
        $type    = $this->requirementService->createType($data, $request->user()->id);
        return response()->json(['message' => 'Requirement type created.', 'data' => $type], 201);
    }

    public function updateType(Request $request, RequirementType $requirementType): JsonResponse
    {
        $data = $request->validate(['name' => ['sometimes', 'string'], 'description' => ['nullable', 'string'], 'is_active' => ['sometimes', 'boolean']]);
        $type = $this->requirementService->updateType($requirementType, $data, $request->user()->id);
        return response()->json(['message' => 'Requirement type updated.', 'data' => $type]);
    }

    public function destroyType(Request $request, RequirementType $requirementType): JsonResponse
    {
        $this->requirementService->deleteType($requirementType, $request->user()->id);
        return response()->json(['message' => 'Requirement type deleted.']);
    }

    public function userRequirements(Request $request): JsonResponse
    {
        $reqs = UserRequirement::with(['user:id,name,email', 'requirementType', 'reviewer:id,name'])
            ->when($request->verification_status, fn($q) => $q->where('verification_status', $request->verification_status))
            ->when($request->approval_status,     fn($q) => $q->where('approval_status', $request->approval_status))
            ->when($request->user_id,             fn($q) => $q->where('user_id', $request->user_id))
            ->latest()->paginate(20);
        return response()->json(['data' => $reqs]);
    }

    public function review(Request $request, UserRequirement $userRequirement): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:500'],
        ]);

        $updated = $this->requirementService->review($userRequirement, $data['status'], $request->user()->id, $data['reason'] ?? null);
        return response()->json(['message' => "Requirement {$data['status']}.", 'data' => $updated]);
    }

    public function clearSubmissions(Request $request): JsonResponse
    {
        $request->validate([
            'user_type' => ['required', 'in:student,faculty_staff,both'],
        ]);
 
        // Super admin only
        abort_unless($request->user()->role?->name === 'super_admin', 403, 'Super admin only.');
 
        $roleMap = match ($request->user_type) {
            'student'       => ['student'],
            'faculty_staff' => ['faculty_staff'],
            'both'          => ['student', 'faculty_staff'],
        };
 
        $submissions = UserRequirement::whereHas(
            'user.role',
            fn($q) => $q->whereIn('name', $roleMap)
        )->get();
 
        $count = $submissions->count();
 
        foreach ($submissions as $submission) {
            if ($submission->file_path) {
                \Illuminate\Support\Facades\Storage::disk('private')->delete($submission->file_path);
            }
        }
 
        UserRequirement::whereHas(
            'user.role',
            fn($q) => $q->whereIn('name', $roleMap)
        )->delete();
 
        return response()->json([
            'message' => "Cleared {$count} requirement submission(s).",
            'cleared' => $count,
        ]);
    }
}
