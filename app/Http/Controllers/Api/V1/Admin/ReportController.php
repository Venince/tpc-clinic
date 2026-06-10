<?php

namespace App\Http\Controllers\Api\V1\Admin;

use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function __construct(private ReportService $reportService) {}

    public function index(Request $request): JsonResponse
    {
        $reports = Report::with('generatedBy:id,name')
            ->when($request->type,   fn($q) => $q->where('type', $request->type))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()->paginate(20);
        return response()->json(['data' => $reports]);
    }

    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'    => ['required', Rule::in(['student_health', 'faculty_health', 'appointment', 'medicine', 'pregnancy', 'survey'])],
            'title'   => ['required', 'string', 'max:255'],
            'format'  => ['required', Rule::in(['pdf', 'excel'])],
            'filters' => ['nullable', 'array'],
            'filters.program_id'  => ['nullable', 'integer', 'exists:programs,id'],
            'filters.year_level'  => ['nullable', 'integer', 'min:1', 'max:4'],
            'filters.is_pregnant' => ['nullable', 'boolean'],
            'filters.status'      => ['nullable', 'string'],
            'filters.date_from'   => ['nullable', 'date'],
            'filters.date_to'     => ['nullable', 'date', 'after_or_equal:filters.date_from'],
            'filters.department'  => ['nullable', 'string'],
        ]);

        $report = $this->reportService->queueReport($data, $request->user()->id);

        return response()->json([
            'message' => 'Report is being generated. You will be notified when ready.',
            'data'    => $report,
        ], 202);
    }

    public function show(Report $report): JsonResponse
    {
        return response()->json(['data' => $report->load('generatedBy:id,name')]);
    }

    public function destroy(Report $report): JsonResponse
    {
        if ($report->file_path) {
            Storage::delete($report->file_path);
        }
        $report->delete();
        return response()->json(['message' => 'Report deleted successfully.']);
    }

    public function download(Report $report): mixed
    {
        if ($report->status !== 'completed' || !$report->file_path) {
            return response()->json(['message' => 'Report is not ready yet.'], 422);
        }

        return response()->download(storage_path('app/' . $report->file_path));
    }
}
