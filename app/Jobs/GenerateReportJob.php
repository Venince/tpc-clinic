<?php
namespace App\Jobs;
use App\Models\Report;
use App\Models\StudentProfile;
use App\Models\FacultyProfile;
use App\Models\Appointment;
use App\Models\Medicine;
use App\Models\SurveyQuestion;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class GenerateReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public int $tries = 3;
    public function __construct(public readonly Report $report) {}

    public function handle(): void
    {
        $this->report->update(['status' => 'processing']);
        try {
            $filters = $this->report->filters ?? [];
            $format  = $this->report->format ?? 'pdf';

            $data = match($this->report->type) {
                'student_health' => StudentProfile::with(['user', 'program'])
                    ->when(isset($filters['program_id']),  fn($q) => $q->where('program_id', $filters['program_id']))
                    ->when(isset($filters['year_level']),  fn($q) => $q->where('year_level', $filters['year_level']))
                    ->when(isset($filters['is_pregnant']), fn($q) => $q->where('is_pregnant', $filters['is_pregnant']))
                    ->get()->toArray(),

                'faculty_health' => FacultyProfile::with('user')
                    ->when(isset($filters['department']),  fn($q) => $q->where('department', $filters['department']))
                    ->when(isset($filters['is_pregnant']), fn($q) => $q->where('is_pregnant', $filters['is_pregnant']))
                    ->get()->toArray(),

                'appointment' => Appointment::with(['user', 'slot', 'reviewer'])
                    ->when(isset($filters['status']),    fn($q) => $q->where('status', $filters['status']))
                    ->when(isset($filters['date_from']), fn($q) => $q->whereHas('slot', fn($s) => $s->whereDate('date', '>=', $filters['date_from'])))
                    ->when(isset($filters['date_to']),   fn($q) => $q->whereHas('slot', fn($s) => $s->whereDate('date', '<=', $filters['date_to'])))
                    ->latest()->get()->toArray(),

                'medicine' => Medicine::with(['requests' => fn($q) => $q->latest()->limit(5), 'requests.user:id,name'])
                    ->when(isset($filters['low_stock']), fn($q) => $q->whereRaw('quantity <= reorder_level'))
                    ->get()->toArray(),

                'pregnancy' => [
                    'students' => StudentProfile::where('is_pregnant', true)->with(['user', 'program'])->get()->toArray(),
                    'faculty'  => FacultyProfile::where('is_pregnant', true)->with('user')->get()->toArray(),
                ],

                'survey' => SurveyQuestion::with('answers.user:id,name')
                    ->withCount(['answers as answers_count' => fn($q) => $q->distinct('user_id')])
                    ->orderBy('sort_order')
                    ->get()
                    ->map(function ($q) {
                        // Keep only the latest answer per user
                        $q->setRelation(
                            'answers',
                            $q->answers
                                ->sortByDesc('updated_at')
                                ->unique('user_id')
                                ->values()
                        );
                        return $q;
                    })
                    ->toArray(),

                default => [],
            };

            if ($format === 'excel') {
                $filename = "reports/{$this->report->type}_{$this->report->id}.xlsx";
                $export   = match($this->report->type) {
                    'student_health' => new \App\Exports\StudentHealthExport($filters),
                    'faculty_health' => new \App\Exports\FacultyHealthExport($filters),
                    'appointment'    => new \App\Exports\AppointmentExport($filters),
                    'medicine'       => new \App\Exports\MedicineInventoryExport($filters),
                    'pregnancy'      => new \App\Exports\PregnancyReportExport(),
                    'survey'         => new \App\Exports\SurveyReportExport(),
                    default          => null,
                };

                if ($export) {
                    \Maatwebsite\Excel\Facades\Excel::store($export, $filename);
                }
            } else {
                $filename = "reports/{$this->report->type}_{$this->report->id}.pdf";
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView(
                    'pdf.reports.' . $this->report->type,
                    ['data' => $data, 'report' => $this->report->load('generatedBy')]
                )->setPaper('a4', 'landscape');
                Storage::put($filename, $pdf->output());
            }

            $this->report->update([
                'status'       => 'completed',
                'file_path'    => $filename,
                'completed_at' => now(),
            ]);
            $this->report->generatedBy->notify(new \App\Notifications\ReportReadyNotification($this->report));

        } catch (\Exception $e) {
            $this->report->update(['status' => 'failed']);
            throw $e;
        }
    }
}