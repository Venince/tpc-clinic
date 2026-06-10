<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProgramController extends Controller
{
    public function __construct(private AuditService $auditService) {}

    public function index(): JsonResponse
    {
        $programs = Program::withCount('studentProfiles')->orderBy('name')->get();
        return response()->json(['data' => $programs]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'        => ['required', 'string', 'max:20', 'unique:programs,code'],
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $program = Program::create($data);
        $this->auditService->log('program_created', $request->user()->id, 'Program', $program->id);
        return response()->json(['message' => 'Program created.', 'data' => $program], 201);
    }

    public function update(Request $request, Program $program): JsonResponse
    {
        $data = $request->validate([
            'code'        => ['sometimes', 'string', 'max:20', Rule::unique('programs')->ignore($program->id)],
            'name'        => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        $program->update($data);
        $this->auditService->log('program_updated', $request->user()->id, 'Program', $program->id);
        return response()->json(['message' => 'Program updated.', 'data' => $program]);
    }

    public function destroy(Request $request, Program $program): JsonResponse
    {
        if ($program->studentProfiles()->exists()) {
            return response()->json(['message' => 'Cannot delete a program with enrolled students.'], 422);
        }
        $program->delete();
        $this->auditService->log('program_deleted', $request->user()->id, 'Program', $program->id);
        return response()->json(['message' => 'Program deleted.']);
    }
}
