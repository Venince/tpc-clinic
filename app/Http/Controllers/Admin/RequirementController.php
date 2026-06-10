<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\RequirementType;
use App\Models\UserRequirement;
use App\Notifications\RequirementStatusNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RequirementController extends Controller {
    public function index(Request $request) {
        return Inertia::render('Admin/Requirements/Index', [
            'types'        => RequirementType::withCount('userRequirements')->orderBy('sort_order')->get(),
            'requirements' => UserRequirement::with(['user.studentProfile.program', 'requirementType', 'reviewer:id,name'])
                ->when($request->program_id, fn($q) => $q->whereHas('user.studentProfile', fn($s) => $s->where('program_id', $request->program_id)))
                ->when($request->status,     fn($q) => $q->where('approval_status', $request->status))
                ->when($request->search,     fn($q) => $q->whereHas('user', fn($u) => $u->where('name', 'like', "%{$request->search}%")->orWhere('email', 'like', "%{$request->search}%")))
                ->latest()->paginate(20)->withQueryString(),
            'programs' => \App\Models\Program::orderBy('name')->get(['id', 'code', 'name']),
            'filters'  => $request->only('program_id', 'status', 'search'),
        ]);
    }
    public function storeType(Request $request) {
        $request->validate(['name'=>['required','string','max:255'],'description'=>['nullable','string']]);
        RequirementType::create(['name'=>$request->name,'description'=>$request->description,'sort_order'=>RequirementType::max('sort_order')+1]);
        return back()->with('success','Requirement type added.');
    }
    public function destroyType(RequirementType $requirementType) { $requirementType->delete(); return back()->with('success','Requirement type deleted.'); }
    public function review(Request $request, UserRequirement $userRequirement) {
        $request->validate(['status'=>['required','in:approved,rejected'],'reason'=>['required_if:status,rejected','nullable','string','max:500']]);
        $userRequirement->update(['approval_status'=>$request->status,'verification_status'=>$request->status==='approved'?'verified':'rejected','rejection_reason'=>$request->reason,'reviewed_by'=>$request->user()->id,'reviewed_at'=>now()]);
        $userRequirement->user->notify(new RequirementStatusNotification($userRequirement->load('requirementType')));
        return back()->with('success',"Requirement {$request->status}.");
    }

    public function clearSubmissions(Request $request): \Illuminate\Http\RedirectResponse
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
 
        // Delete physical files
        foreach ($submissions as $submission) {
            if ($submission->file_path) {
                \Illuminate\Support\Facades\Storage::disk('private')->delete($submission->file_path);
            }
        }
 
        UserRequirement::whereHas(
            'user.role',
            fn($q) => $q->whereIn('name', $roleMap)
        )->delete();
 
        $label = match ($request->user_type) {
            'student'       => 'student',
            'faculty_staff' => 'faculty/staff',
            'both'          => 'all',
        };
 
        return back()->with('success', "Cleared {$count} {$label} requirement submission(s).");
    }

    public function streamFile(UserRequirement $userRequirement): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $disk = \Illuminate\Support\Facades\Storage::disk('private');

        abort_unless($disk->exists($userRequirement->file_path), 404);

        $stream   = $disk->readStream($userRequirement->file_path);
        $mimeType = $userRequirement->mime_type ?? 'application/octet-stream';
        $filename = $userRequirement->original_filename;

        return response()->stream(
            function () use ($stream) {
                fpassthru($stream);
                if (is_resource($stream)) fclose($stream);
            },
            200,
            [
                'Content-Type'        => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $filename . '"',
                'Cache-Control'       => 'no-store',
            ]
        );
    }
}
