<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Services\RequirementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RequirementController extends Controller
{
    public function __construct(private RequirementService $requirementService) {}

    public function myStatus(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->requirementService->getUserCompletionStatus($request->user()->id)]);
    }

    public function upload(Request $request): JsonResponse
    {
        $data = $request->validate([
            'requirement_type_id' => ['required', 'integer', 'exists:requirement_types,id'],
            'file'                => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'],
        ]);

        $requirement = $this->requirementService->uploadRequirement(
            $request->user()->id,
            $data['requirement_type_id'],
            $request->file('file')
        );

        return response()->json(['message' => 'Requirement uploaded.', 'data' => $requirement], 201);
    }
}
