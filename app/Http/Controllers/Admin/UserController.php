<?php

namespace App\Http\Controllers\Admin;

use App\Exports\NeverLoggedInUsersExport;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use App\Jobs\SendCredentialsEmail;
use App\Notifications\PasswordChangedByAdminNotification;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class UserController extends Controller
{
    /** Maximum email lines processed per bulk import when a real queue worker sends the mail. */
    private const IMPORT_LIMIT = 500;

    /**
     * With QUEUE_CONNECTION=sync every credentials email is sent INSIDE the web request
     * (1-3 s each over Gmail SMTP), so a big import would hit PHP's time limit, the
     * proxy timeout and Gmail's daily cap. Keep batches small in that mode, or switch
     * to QUEUE_CONNECTION=database/redis with a running worker.
     */
    private const SYNC_IMPORT_LIMIT = 25;

    /** Stop a sync-mode import when this many emails in a row fail (bad SMTP settings). */
    private const MAX_CONSECUTIVE_MAIL_FAILURES = 3;

    public function index(Request $request)
    {
        $isSuperAdmin = $request->user()->role->name === 'super_admin';

        $users = User::with(['role', 'studentProfile', 'facultyProfile'])
            ->when(!$isSuperAdmin, fn($q) => $q->whereHas('role', fn($r) => $r->where('name', '!=', 'super_admin')))
            ->when($request->search, fn($q) => $q->where(fn($s) => $s
                ->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%")))
            ->when(
                $request->role && ($isSuperAdmin || $request->role !== 'super_admin'),
                fn($q) => $q->whereHas('role', fn($r) => $r->where('name', $request->role))
            )
            ->when($request->filled('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $roles = $isSuperAdmin
            ? Role::all(['id', 'name', 'display_name'])
            : Role::whereNotIn('name', ['super_admin'])->get(['id', 'name', 'display_name']);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only('search', 'role', 'is_active'),
            'roles' => $roles,
            // Shown to all admins (export). The bulk-delete button is still
            // super_admin only (gated in the UI and in destroyNeverLoggedIn),
            // and neither action ever targets super_admin accounts.
            'neverLoggedInCount' => User::whereNull('last_login_at')
                ->whereHas('role', fn($r) => $r->where('name', '!=', 'super_admin'))
                ->count(),
        ]);
    }

    public function create(Request $request)
    {
        $roles = $request->user()->isSuperAdmin()
            ? Role::whereNotIn('name', ['super_admin'])->get(['id', 'name', 'display_name'])
            : Role::whereNotIn('name', ['super_admin', 'admin'])->get(['id', 'name', 'display_name']);

        return Inertia::render('Admin/Users/Create', [
            'roles'    => $roles,
            'programs' => \App\Models\Program::orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    public function importForm()
    {
        return Inertia::render('Admin/Users/Import', [
            'roles' => Role::whereNotIn('name', ['super_admin', 'admin'])
                ->get(['id', 'name', 'display_name']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                Rule::unique('users')->whereNull('deleted_at'),
            ],
            'role' => ['required', Rule::in(['student', 'faculty_staff', 'admin'])],
            // Only relevant when role is admin — lets the nurse designate which
            // personal account (Student or Faculty/Staff) this admin can switch
            // into. Optional: an admin can also have no personal account.
            'personal_type' => ['nullable', Rule::in(['student', 'faculty_staff'])],
            'program_id'    => ['nullable', 'exists:programs,id'],
            'year_level'    => ['nullable', 'integer', 'min:1', 'max:6'],
        ]);

        $role = Role::where('name', $data['role'])->firstOrFail();
        $password = User::generateTemporaryPassword();

        $user = User::create([
            'name' => $data['name'],
            'email' => Str::lower($data['email']),
            'role_id' => $role->id,
            'password' => Hash::make($password),
            'force_password_change' => true,
            'is_active' => true,
        ]);

        // If this is an admin account with a designated personal type, create
        // the matching (initially empty) profile so they can switch into it
        // and complete the remaining details themselves, just like a regular
        // student/faculty account would on first login.
        if ($data['role'] === 'admin' && !empty($data['personal_type'])) {
            if ($data['personal_type'] === 'student') {
                $user->studentProfile()->create([
                    'program_id' => $data['program_id'] ?? null,
                    'year_level' => $data['year_level'] ?? null,
                ]);
            } else {
                $user->facultyProfile()->create([]);
            }
        }

        $emailFailed = false;
        try {
            SendCredentialsEmail::dispatch($user, $password);
        } catch (\Throwable $e) {
            $emailFailed = true;
            Log::error('Credentials email failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_created',
            'model_type' => 'User',
            'model_id' => $user->id,
            'ip_address' => $request->ip(),
        ]);

        $delivery = config('queue.default') === 'sync' ? 'sent' : 'queued';

        return redirect()->route('admin.users.index')->with(
            $emailFailed ? 'error' : 'success',
            $emailFailed
                ? 'User created, but the credentials email could not be sent. Set a temporary password for this user so they can sign in.'
                : "User created. The credentials email has been {$delivery}; if it does not arrive, set a temporary password for the user."
        );
    }

    public function edit(User $user)
    {
        abort_if($user->role->name === 'super_admin' && !request()->user()->isSuperAdmin(), 403);

        return Inertia::render('Admin/Users/Edit', [
            'user'     => $user->load('role', 'studentProfile.program', 'facultyProfile'),
            'roles'    => Role::whereNotIn('name', ['super_admin'])->get(['id', 'name', 'display_name']),
            'programs' => \App\Models\Program::orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    public function show(Request $request, User $user)
    {
        abort_if($user->role->name === 'super_admin' && !$request->user()->isSuperAdmin(), 403);

        $user->load(['role', 'studentProfile.program', 'facultyProfile']);

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'appointments' => $user->appointments()->with('slot')->latest()->get(),
            'medicineRequests' => $user->medicineRequests()->with('medicine')->latest()->get(),
            'surveyAnswers' => $user->surveyAnswers()->with('question')->get(),
            'requirements' => $user->requirements()->with('requirementType')->latest()->get(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        abort_if($user->role->name === 'super_admin' && !$request->user()->isSuperAdmin(), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                Rule::unique('users')->ignore($user->id)->whereNull('deleted_at'),
            ],
            'is_active' => ['boolean'],
            // Only meaningful for admin accounts — lets the nurse add, change,
            // or remove which personal account (Student / Faculty-Staff) this
            // admin can switch into.
            'personal_type' => ['nullable', Rule::in(['student', 'faculty_staff'])],
            'program_id'    => ['nullable', 'exists:programs,id'],
            'year_level'    => ['nullable', 'integer', 'min:1', 'max:6'],
        ]);

        $user->update([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'is_active' => $data['is_active'] ?? $user->is_active,
        ]);

        if ($user->role->name === 'admin') {
            $currentType = $user->studentProfile ? 'student' : ($user->facultyProfile ? 'faculty_staff' : null);
            $newType     = $data['personal_type'] ?? null;

            if ($newType !== $currentType) {
                // Remove whichever profile no longer applies
                if ($currentType === 'student' && $newType !== 'student') {
                    $user->studentProfile()->delete();
                }
                if ($currentType === 'faculty_staff' && $newType !== 'faculty_staff') {
                    $user->facultyProfile()->delete();
                }
                // Create the newly designated profile
                if ($newType === 'student' && $currentType !== 'student') {
                    $user->studentProfile()->create([
                        'program_id' => $data['program_id'] ?? null,
                        'year_level' => $data['year_level'] ?? null,
                    ]);
                }
                if ($newType === 'faculty_staff' && $currentType !== 'faculty_staff') {
                    $user->facultyProfile()->create([]);
                }
            } elseif ($newType === 'student' && $user->studentProfile) {
                // Type unchanged but program/year may have been adjusted
                $user->studentProfile()->update([
                    'program_id' => $data['program_id'] ?? $user->studentProfile->program_id,
                    'year_level' => $data['year_level'] ?? $user->studentProfile->year_level,
                ]);
            }
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_updated',
            'model_type' => 'User',
            'model_id' => $user->id,
            'ip_address' => $request->ip(),
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User updated.');
    }

    public function updatePassword(Request $request, User $user)
    {
        abort_if($user->role->name === 'super_admin' && !$request->user()->isSuperAdmin(), 403);

        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // forceFill because remember_token is intentionally not mass-assignable.
        // Rotating it signs out any "remember me" session that used the old password.
        $user->forceFill([
            'password' => Hash::make($data['password']),
            'force_password_change' => true,
            'remember_token' => Str::random(60),
        ])->save();

        // The password is already changed at this point. If the notification email
        // fails (e.g. Gmail limit with the sync queue), don't turn the whole request
        // into a 500 page and leave the admin unsure whether it worked.
        try {
            $user->notify(new PasswordChangedByAdminNotification($request->user()));
        } catch (\Throwable $e) {
            report($e);
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'password_changed_by_admin',
            'model_type' => 'User',
            'model_id' => $user->id,
            'ip_address' => $request->ip(),
        ]);

        return back()->with('success', "Password updated for {$user->name}. They will be asked to set a new password on next login.");
    }

    public function destroy(Request $request, User $user)
    {
        abort_if($user->role->name === 'super_admin' && !$request->user()->isSuperAdmin(), 403);

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->studentProfile?->delete();
        $user->facultyProfile?->delete();
        $user->delete();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_deleted',
            'model_type' => 'User',
            'model_id' => $user->id,
            'ip_address' => $request->ip(),
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User deleted.');
    }

    public function destroyNeverLoggedIn(Request $request)
    {
        abort_unless($request->user()->isSuperAdmin(), 403, 'Super admin only.');

        // Never touch super_admin accounts here, regardless of login status —
        // this action only targets student/faculty/admin accounts that have
        // literally never authenticated.
        $query = User::whereNull('last_login_at')
            ->whereHas('role', fn($r) => $r->where('name', '!=', 'super_admin'));

        $users = $query->get();
        $count = $users->count();

        if ($count === 0) {
            return back()->with('error', 'No never-logged-in accounts to delete.');
        }

        foreach ($users as $user) {
            $user->studentProfile?->delete();
            $user->facultyProfile?->delete();
        }

        // Re-run the same scoping condition for the actual delete, rather than
        // deleting by collected IDs, so this stays correct even if the table
        // changed between the SELECT and the DELETE.
        User::whereNull('last_login_at')
            ->whereHas('role', fn($r) => $r->where('name', '!=', 'super_admin'))
            ->delete();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'bulk_delete_never_logged_in',
            'model_type' => 'User',
            'model_id' => null,
            'ip_address' => $request->ip(),
        ]);

        return redirect()->route('admin.users.index')->with('success', "Deleted {$count} account(s) that never logged in.");
    }

    public function exportNeverLoggedIn(Request $request)
    {
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'export_never_logged_in',
            'model_type' => 'User',
            'model_id' => null,
            'ip_address' => $request->ip(),
        ]);

        return Excel::download(
            new NeverLoggedInUsersExport(),
            'never-logged-in-users-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function toggleActive(Request $request, User $user)
    {
        abort_if($user->role->name === 'super_admin' && !$request->user()->isSuperAdmin(), 403);

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $user->update(['is_active' => !$user->is_active]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => $user->is_active ? 'user_activated' : 'user_deactivated',
            'model_type' => 'User',
            'model_id' => $user->id,
            'ip_address' => $request->ip(),
        ]);

        return back()->with('success', 'User status updated.');
    }

    public function bulkImport(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:txt', 'max:2048'],
            'role' => [
                'required',
                Rule::in(
                    $request->user()->isSuperAdmin()
                    ? ['student', 'faculty_staff', 'admin']
                    : ['student', 'faculty_staff']
                )
            ],
        ]);

        $sync  = config('queue.default') === 'sync';
        $limit = $sync ? self::SYNC_IMPORT_LIMIT : self::IMPORT_LIMIT;

        if ($sync) {
            // Emails are sent inline in this mode; allow the request to run longer.
            @set_time_limit(300);
        }

        $emails       = $this->readEmailLines($request->file('file'));
        $notProcessed = max(0, count($emails) - $limit);
        $emails       = array_slice($emails, 0, $limit);

        $role = Role::where('name', $request->role)->firstOrFail();
        $results = ['created' => 0, 'skipped' => 0, 'failed' => 0, 'email_failed' => 0];

        $queued              = 0;
        $consecutiveFailures = 0;
        $halted              = false;

        foreach ($emails as $index => $email) {
            // Strict email validation
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
                $results['failed']++;
                continue;
            }

            if (User::where('email', $email)->whereNull('deleted_at')->exists()) {
                $results['skipped']++;
                continue;
            }

            $password = User::generateTemporaryPassword();
            $user = User::create([
                'name' => ucwords(str_replace(['.', '_', '-'], ' ', explode('@', $email)[0])),
                'email' => $email,
                'role_id' => $role->id,
                'password' => Hash::make($password),
                'force_password_change' => true,
                'is_active' => true,
            ]);
            $results['created']++;

            try {
                // The delay spaces out sends when a real queue worker is used, which
                // eases provider rate limits. It has no effect with the sync driver.
                SendCredentialsEmail::dispatch($user, $password)
                    ->delay(now()->addSeconds($queued * 2));
                $consecutiveFailures = 0;
            } catch (\Throwable $e) {
                $results['email_failed']++;
                $consecutiveFailures++;
                Log::error('Credentials email failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);

                // Every send is failing (wrong SMTP host/port/password, daily limit hit).
                // Stop instead of creating more accounts nobody can sign in to.
                if ($sync && $consecutiveFailures >= self::MAX_CONSECUTIVE_MAIL_FAILURES) {
                    $halted = true;
                    $notProcessed += count($emails) - $index - 1;
                    break;
                }
            }

            $queued++;
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'bulk_import',
            'model_type' => 'User',
            'model_id' => null,
            'ip_address' => $request->ip(),
        ]);

        $summary = "Import complete: {$results['created']} created, {$results['skipped']} skipped, {$results['failed']} invalid.";
        $notes   = [];

        if ($halted) {
            $notes[] = 'Stopped early after ' . self::MAX_CONSECUTIVE_MAIL_FAILURES . " emails in a row failed to send. Check the mail settings (host, port 587, username, app password), then import the same file again; existing accounts are skipped. {$notProcessed} line(s) were not processed.";
        } elseif ($notProcessed > 0) {
            $notes[] = "{$notProcessed} line(s) were not processed (limit of {$limit} per import). Import the same file again to continue; existing accounts are skipped.";
        }

        if ($results['email_failed'] > 0) {
            $notes[] = "{$results['email_failed']} credentials email(s) could not be sent; those users need a temporary password set by an admin.";

            return back()->with('error', trim($summary . ' ' . implode(' ', $notes)));
        }

        // ($halted can only be true when at least one email failed, handled above.)
        $notes[] = $sync
            ? 'Credentials emails have been sent.'
            : 'Credentials emails have been queued; check the failed jobs list if users report not receiving them.';

        return back()->with('success', trim($summary . ' ' . implode(' ', $notes)));
    }

    /**
     * Read the uploaded .txt into a de-duplicated, lower-cased list of non-empty lines.
     * Handles files saved by Windows tools: UTF-8 with BOM and UTF-16 (Excel "Unicode Text").
     *
     * @return string[]
     */
    private function readEmailLines(UploadedFile $file): array
    {
        $raw = (string) file_get_contents($file->getRealPath());

        if (str_starts_with($raw, "\xFF\xFE")) {
            $raw = mb_convert_encoding(substr($raw, 2), 'UTF-8', 'UTF-16LE');
        } elseif (str_starts_with($raw, "\xFE\xFF")) {
            $raw = mb_convert_encoding(substr($raw, 2), 'UTF-8', 'UTF-16BE');
        }

        // A UTF-8 BOM is not removed by trim() and would make the first email invalid.
        $raw = preg_replace('/^\xEF\xBB\xBF/', '', $raw);

        // Normalize line endings, split, trim, remove blanks
        $lines = array_filter(
            array_map('trim', preg_split('/\r\n|\r|\n/', $raw)),
            fn ($line) => $line !== ''
        );

        return array_values(array_unique(array_map(fn ($line) => Str::lower($line), $lines)));
    }
}