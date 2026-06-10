<?php

namespace App\Services;

use App\Exports\AppointmentExport;
use App\Exports\MedicineInventoryExport;
use App\Exports\StudentHealthExport;
use App\Jobs\GenerateReportJob;
use App\Models\Report;
use Maatwebsite\Excel\Facades\Excel;

class ReportService
{
    public function __construct(private AuditService $auditService) {}

    public function queueReport(array $data, int $userId): Report
    {
        $report = Report::create([
            'generated_by' => $userId,
            'type'         => $data['type'],
            'title'        => $data['title'],
            'filters'      => $data['filters'] ?? null,
            'format'       => $data['format'] ?? 'pdf',
            'status'       => 'pending',
        ]);

        GenerateReportJob::dispatch($report);
        $this->auditService->log('report_queued', $userId, 'Report', $report->id);
        return $report;
    }

    public function generateStudentHealthReport(array $filters = []): array
    {
        $query = \App\Models\StudentProfile::with(['user', 'program'])
            ->when(array_key_exists('program_id', $filters) && $filters['program_id'],
                fn($q) => $q->where('program_id', $filters['program_id']))
            ->when(array_key_exists('year_level', $filters) && $filters['year_level'],
                fn($q) => $q->where('year_level', $filters['year_level']))
            ->when(array_key_exists('is_pregnant', $filters) && isset($filters['is_pregnant']),
                fn($q) => $q->where('is_pregnant', $filters['is_pregnant']));

        return $query->get()->map(fn($p) => [
            'user'        => ['name' => $p->user?->name ?? '—'],
            'program'     => ['name' => $p->program?->name ?? '—', 'code' => $p->program?->code ?? '—'],
            'year_level'  => $p->year_level ?? '—',
            'sex'         => $p->sex ?? '—',
            'is_pregnant' => (bool) $p->is_pregnant,
        ])->toArray();
    }

    public function generateFacultyHealthReport(array $filters = []): array
    {
        $query = \App\Models\FacultyProfile::with('user')
            ->when(isset($filters['department']),  fn($q) => $q->where('department', $filters['department']))
            ->when(isset($filters['is_pregnant']), fn($q) => $q->where('is_pregnant', $filters['is_pregnant']));

        return $query->get()->toArray();
    }

    public function generateAppointmentReport(array $filters = []): array
    {
        $query = \App\Models\Appointment::with(['user', 'slot', 'reviewer'])
            ->when(isset($filters['status']),     fn($q) => $q->where('status', $filters['status']))
            ->when(isset($filters['date_from']),  fn($q) => $q->whereHas('slot', fn($s) => $s->whereDate('date', '>=', $filters['date_from'])))
            ->when(isset($filters['date_to']),    fn($q) => $q->whereHas('slot', fn($s) => $s->whereDate('date', '<=', $filters['date_to'])));

        return $query->get()->toArray();
    }

    public function generateMedicineReport(array $filters = []): array
    {
        $query = \App\Models\Medicine::when(isset($filters['low_stock']), fn($q) => $q->whereRaw('quantity <= reorder_level'));
        return $query->get()->toArray();
    }

    public function generatePregnancyReport(array $filters = []): array
    {
        return [
            'students' => \App\Models\StudentProfile::where('is_pregnant', true)->with(['user', 'program'])->get()->toArray(),
            'faculty'  => \App\Models\FacultyProfile::where('is_pregnant', true)->with('user')->get()->toArray(),
        ];
    }

    public function generateSurveyReport(array $filters = []): array
    {
        $questions = \App\Models\SurveyQuestion::with('answers')->get();
        return $questions->map(fn($q) => [
            'question'      => $q->question,
            'type'          => $q->type,
            'total_answers' => $q->answers->count(),
            'answers'       => $q->answers->pluck('answer'),
        ])->toArray();
    }
}
