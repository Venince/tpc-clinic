<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\RequirementType;
use App\Models\User;
use App\Models\UserRequirement;
use App\Notifications\RequirementStatusNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RequirementController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/Requirements/Index', [
            'types'        => RequirementType::with('program:id,code,name')
                ->withCount('userRequirements')
                ->orderBy('sort_order')
                ->get(),
            // One row per person (not per file), each carrying all of their submissions,
            // so an admin can review everything a student/faculty member uploaded in one place.
            'people' => User::query()
                ->whereHas('requirements', fn($q) => $q->when($request->status, fn($s) => $s->where('approval_status', $request->status)))
                ->when($request->program_id, fn($q) => $q->whereHas('studentProfile', fn($s) => $s->where('program_id', $request->program_id)))
                ->when($request->search,     fn($q) => $q->where(fn($u) => $u->where('name', 'like', "%{$request->search}%")->orWhere('email', 'like', "%{$request->search}%")))
                ->with([
                    'role:id,name',
                    'studentProfile:id,user_id,program_id,year_level',
                    'studentProfile.program:id,code,name',
                    'facultyProfile:id,user_id,department,position',
                    'requirements' => fn($q) => $q->with(['requirementType', 'reviewer:id,name']),
                ])
                ->withMax('requirements as latest_upload_at', 'created_at')
                // People with something still pending first, then newest upload first.
                ->orderByRaw("EXISTS (SELECT 1 FROM user_requirements ur WHERE ur.user_id = users.id AND ur.approval_status = 'pending') DESC")
                ->orderByDesc('latest_upload_at')
                ->paginate(15)->withQueryString(),
            'pendingTotal' => UserRequirement::where('approval_status', 'pending')->count(),
            'programs' => \App\Models\Program::orderBy('name')->get(['id', 'code', 'name']),
            'filters'  => $request->only('program_id', 'status', 'search'),
        ]);
    }

    public function storeType(Request $request)
    {
        $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_required' => ['boolean'],
            'program_id'  => ['nullable', 'exists:programs,id'],
            'year_level'  => ['nullable', 'integer', 'min:1', 'max:6'],
        ]);

        RequirementType::create([
            'name'        => $request->name,
            'description' => $request->description,
            'is_required' => $request->boolean('is_required', false),
            'program_id'  => $request->program_id ?: null,
            'year_level'  => $request->year_level  ?: null,
            'sort_order'  => RequirementType::max('sort_order') + 1,
        ]);

        return back()->with('success', 'Requirement type added.');
    }

    public function updateType(Request $request, RequirementType $requirementType)
    {
        $request->validate([
            'is_required' => ['required', 'boolean'],
        ]);

        $requirementType->update(['is_required' => $request->boolean('is_required')]);

        return back()->with('success', 'Requirement type updated.');
    }

    public function destroyType(RequirementType $requirementType)
    {
        $requirementType->delete();
        return back()->with('success', 'Requirement type deleted.');
    }

    public function review(Request $request, UserRequirement $userRequirement)
    {
        $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:500'],
        ]);

        $userRequirement->update([
            'approval_status'     => $request->status,
            'verification_status' => $request->status === 'approved' ? 'verified' : 'rejected',
            'rejection_reason'    => $request->reason,
            'reviewed_by'         => $request->user()->id,
            'reviewed_at'         => now(),
        ]);

        $userRequirement->user->notify(new RequirementStatusNotification($userRequirement->load('requirementType')));

        return back()->with('success', "Requirement {$request->status}.");
    }

    /**
     * Approve every pending submission of one person in a single action.
     * Each item still gets its own status notification, same as approving one by one.
     */
    public function approveAllForUser(Request $request, User $user)
    {
        $pending = UserRequirement::with('requirementType')
            ->where('user_id', $user->id)
            ->where('approval_status', 'pending')
            ->whereNotNull('file_path')
            ->get();

        if ($pending->isEmpty()) {
            return back()->with('error', 'There are no pending requirements for this user.');
        }

        foreach ($pending as $requirement) {
            $requirement->update([
                'approval_status'     => 'approved',
                'verification_status' => 'verified',
                'rejection_reason'    => null,
                'reviewed_by'         => $request->user()->id,
                'reviewed_at'         => now(),
            ]);

            $user->notify(new RequirementStatusNotification($requirement));
        }

        AuditLog::create([
            'user_id'     => $request->user()->id,
            'action'      => 'requirements_approved_all',
            'model_type'  => 'User',
            'model_id'    => $user->id,
            'ip_address'  => $request->ip(),
            'description' => "Approved {$pending->count()} pending requirement(s) for {$user->name}.",
        ]);

        return back()->with('success', "Approved {$pending->count()} requirement(s) for {$user->name}.");
    }

    public function destroy(Request $request, UserRequirement $userRequirement)
    {
        abort_unless($request->user()->role?->name === 'super_admin', 403, 'Super admin only.');

        if ($userRequirement->approval_status === 'pending') {
            return back()->with('error', 'Only approved or rejected submissions can be deleted.');
        }

        if ($userRequirement->file_path) {
            \Illuminate\Support\Facades\Storage::disk('private')->delete($userRequirement->file_path);
        }

        $userRequirement->delete();

        return back()->with('success', 'Submission deleted.');
    }

    public function clearSubmissions(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'user_type' => ['required', 'in:student,faculty_staff,both'],
        ]);

        abort_unless($request->user()->role?->name === 'super_admin', 403, 'Super admin only.');

        $roleMap = match ($request->user_type) {
            'student'       => ['student'],
            'faculty_staff' => ['faculty_staff'],
            'both'          => ['student', 'faculty_staff'],
        };

        $submissions = UserRequirement::whereHas(
            'user.role', fn($q) => $q->whereIn('name', $roleMap)
        )->get();

        $count = $submissions->count();

        foreach ($submissions as $submission) {
            if ($submission->file_path) {
                \Illuminate\Support\Facades\Storage::disk('private')->delete($submission->file_path);
            }
        }

        UserRequirement::whereHas(
            'user.role', fn($q) => $q->whereIn('name', $roleMap)
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