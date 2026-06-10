<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateReportJob;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ReportController extends Controller {
    public function index() {
        return Inertia::render('Admin/Reports/Index',['reports'=>Report::with('generatedBy:id,name')->latest()->paginate(15)]);
    }
    public function store(Request $request) {
        $data = $request->validate(['type'=>['required',Rule::in(['student_health','faculty_health','appointment','medicine','pregnancy','survey'])],'title'=>['required','string','max:255'],'format'=>['required',Rule::in(['pdf','excel'])],'filters'=>['nullable','array']]);
        $report = Report::create(array_merge($data,['generated_by'=>$request->user()->id,'status'=>'pending']));
        GenerateReportJob::dispatch($report);
        return back()->with('success','Report queued. You will be notified when ready.');
    }
    public function destroy(Report $report) {
        if ($report->file_path) {
            Storage::delete($report->file_path);
        }
        $report->delete();
        return back()->with('success', 'Report deleted successfully.');
    }
    public function download(Report $report) {
        if($report->status!=='completed'||!$report->file_path) return back()->with('error','Report not ready yet.');
        return response()->download(storage_path('app/'.$report->file_path));
    }
}