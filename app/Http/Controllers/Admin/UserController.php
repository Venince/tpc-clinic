<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use App\Jobs\SendCredentialsEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $isSuperAdmin = $request->user()->role->name === 'super_admin';

        $users = User::with(['role', 'studentProfile', 'facultyProfile'])
            ->when(!$isSuperAdmin, fn($q) => $q->whereHas('role', fn($r) => $r->where('name', '!=', 'super_admin')))
            ->when($request->search, fn($q) => $q->where(fn($s) => $s->where('name', 'like', "%{$request->search}%")->orWhere('email', 'like', "%{$request->search}%")))
            ->when($request->role && ($isSuperAdmin || $request->role !== 'super_admin'),
                fn($q) => $q->whereHas('role', fn($r) => $r->where('name', $request->role)))
            ->when($request->filled('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $roles = $isSuperAdmin
            ? Role::all(['id', 'name', 'display_name'])
            : Role::whereNotIn('name', ['super_admin'])->get(['id', 'name', 'display_name']);

        return Inertia::render('Admin/Users/Index', [
            'users'   => $users,
            'filters' => $request->only('search', 'role', 'is_active'),
            'roles'   => $roles,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Create', [
            'roles' => Role::whereNotIn('name', ['super_admin'])->get(['id', 'name', 'display_name']),
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
            'name'  => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                Rule::unique('users')->whereNull('deleted_at'),
            ],
            'role'  => ['required', Rule::in(['student', 'faculty_staff', 'admin'])],
        ]);

        $role     = Role::where('name', $data['role'])->firstOrFail();
        $password = Str::random(12);

        $user = User::create([
            'name'                  => $data['name'],
            'email'                 => $data['email'],
            'role_id'               => $role->id,
            'password'              => Hash::make($password),
            'force_password_change' => true,
            'is_active'             => true,
        ]);

        SendCredentialsEmail::dispatch($user, $password);

        AuditLog::create(['user_id' => $request->user()->id, 'action' => 'user_created',
            'model_type' => 'User', 'model_id' => $user->id, 'ip_address' => $request->ip()]);

        return redirect()->route('admin.users.index')->with('success', 'User created and credentials sent.');
    }

    public function edit(User $user)
    {
        abort_if($user->role->name === 'super_admin' && !request()->user()->isSuperAdmin(), 403);

        return Inertia::render('Admin/Users/Edit', [
            'user'  => $user->load('role', 'studentProfile.program', 'facultyProfile'),
            'roles' => Role::whereNotIn('name', ['super_admin'])->get(['id', 'name', 'display_name']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        abort_if($user->role->name === 'super_admin' && !$request->user()->isSuperAdmin(), 403);

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                Rule::unique('users')->ignore($user->id)->whereNull('deleted_at'),
            ],
            'is_active' => ['boolean'],
        ]);

        $user->update($data);

        AuditLog::create(['user_id' => $request->user()->id, 'action' => 'user_updated',
            'model_type' => 'User', 'model_id' => $user->id, 'ip_address' => $request->ip()]);

        return redirect()->route('admin.users.index')->with('success', 'User updated.');
    }

    public function destroy(Request $request, User $user)
    {
        abort_if($user->role->name === 'super_admin' && !$request->user()->isSuperAdmin(), 403);

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        // Delete related profiles so student_id/faculty data is freed up
        $user->studentProfile?->delete();
        $user->facultyProfile?->delete();

        $user->delete();

        AuditLog::create(['user_id' => $request->user()->id, 'action' => 'user_deleted',
            'model_type' => 'User', 'model_id' => $user->id, 'ip_address' => $request->ip()]);

        return redirect()->route('admin.users.index')->with('success', 'User deleted.');
    }

    public function toggleActive(Request $request, User $user)
    {
        abort_if($user->role->name === 'super_admin' && !$request->user()->isSuperAdmin(), 403);

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $user->update(['is_active' => !$user->is_active]);

        AuditLog::create(['user_id' => $request->user()->id,
            'action' => $user->is_active ? 'user_activated' : 'user_deactivated',
            'model_type' => 'User', 'model_id' => $user->id, 'ip_address' => $request->ip()]);

        return back()->with('success', 'User status updated.');
    }

    public function bulkImport(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:txt', 'max:2048'],
            'role' => ['required', Rule::in(['student', 'faculty_staff'])],
        ]);

        $emails   = array_filter(array_map('trim', explode("\n", file_get_contents($request->file('file')->getRealPath()))));
        $role     = Role::where('name', $request->role)->firstOrFail();
        $results  = ['created' => 0, 'skipped' => 0, 'failed' => 0];

        foreach ($emails as $email) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $results['failed']++; continue; }
            if (User::where('email', $email)->whereNull('deleted_at')->exists()) {
                $results['skipped']++;
                continue;
            }

            $password = Str::random(12);
            $user     = User::create([
                'name'     => ucwords(str_replace(['.','_','-'],' ', explode('@', $email)[0])),
                'email'    => $email,
                'role_id'  => $role->id,
                'password' => Hash::make($password),
                'force_password_change' => true,
            ]);

            SendCredentialsEmail::dispatch($user, $password);
            $results['created']++;
        }

        return back()->with('success', "Import complete: {$results['created']} created, {$results['skipped']} skipped, {$results['failed']} failed.");
    }
}
