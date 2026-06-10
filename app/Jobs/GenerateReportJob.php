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
            $filters  = $this->report->filters ?? [];
            $filename = "reports/{$this->report->type}_{$this->report->id}.pdf";

            $data = match($this->report->type) {
                'student_health' => StudentProfile::with(['user','program'])->when(isset($filters['program_id']),fn($q)=>$q->where('program_id',$filters['program_id']))->get()->toArray(),
                'faculty_health' => FacultyProfile::with('user')->get()->toArray(),
                'appointment'    => Appointment::with(['user','slot'])->when(isset($filters['status']),fn($q)=>$q->where('status',$filters['status']))->get()->toArray(),
                'medicine'       => Medicine::all()->toArray(),
                'pregnancy'      => ['students'=>StudentProfile::where('is_pregnant',true)->with(['user','program'])->get()->toArray(),'faculty'=>FacultyProfile::where('is_pregnant',true)->with('user')->get()->toArray()],
                'survey'         => SurveyQuestion::withCount('answers')->orderBy('sort_order')->get()->toArray(),
                default          => [],
            };

            $pdf = Pdf::loadView('pdf.reports.'.$this->report->type, ['data'=>$data,'report'=>$this->report->load('generatedBy')])->setPaper('a4','landscape');
            Storage::put($filename, $pdf->output());

            $this->report->update(['status'=>'completed','file_path'=>$filename,'completed_at'=>now()]);
            $this->report->generatedBy->notify(new \App\Notifications\ReportReadyNotification($this->report));
        } catch (\Exception $e) {
            $this->report->update(['status'=>'failed']);
            throw $e;
        }
    }
}
