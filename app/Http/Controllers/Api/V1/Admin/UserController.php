<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\AuthService;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private AuthService $authService,
        private AuditService $auditService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $filters = $request->only('role', 'search', 'is_active');

        // Admins cannot see super_admin users
        if ($request->user()->role->name !== 'super_admin') {
            $filters['exclude_roles'] = ['super_admin'];

            // Also prevent admins from filtering *by* super_admin role
            if (isset($filters['role']) && $filters['role'] === 'super_admin') {
                unset($filters['role']);
            }
        }

        $users = $this->userRepository->paginate($filters);

        return response()->json([
            'data' => UserResource::collection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'per_page'     => $users->perPage(),
                'total'        => $users->total(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json([
            'data' => new UserResource($user->load('role', 'studentProfile.program', 'facultyProfile')),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'role'     => ['required', 'string', Rule::in(['student', 'faculty_staff', 'admin'])],
            'is_active'=> ['boolean'],
        ]);

        $role     = Role::where('name', $data['role'])->firstOrFail();
        $password = Str::random(12);

        $user = User::create([
            'name'                  => $data['name'],
            'email'                 => $data['email'],
            'role_id'               => $role->id,
            'password'              => Hash::make($password),
            'force_password_change' => true,
            'is_active'             => $data['is_active'] ?? true,
        ]);

        \App\Jobs\SendCredentialsEmail::dispatch($user, $password);

        $this->auditService->log('user_created', $request->user()->id, 'User', $user->id,
            null, ['email' => $user->email, 'role' => $data['role']]);

        return response()->json(['message' => 'User created. Credentials sent via email.', 'data' => new UserResource($user->load('role'))], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $data = $request->validate([
            'name'      => ['sometimes', 'string', 'max:255'],
            'email'     => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $old = $user->only('name', 'email', 'is_active');
        $user = $this->userRepository->update($user, $data);

        $this->auditService->log('user_updated', $request->user()->id, 'User', $user->id, $old, $data);

        return response()->json(['message' => 'User updated.', 'data' => new UserResource($user)]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account.'], 422);
        }

        $this->auditService->log('user_deleted', $request->user()->id, 'User', $user->id, $user->toArray());
        $this->userRepository->delete($user);

        return response()->json(['message' => 'User deleted.']);
    }

    public function bulkImport(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $request->validate([
            'file' => ['required', 'file', 'mimes:txt', 'max:2048'],
            'role' => ['required', 'string', Rule::in(['student', 'faculty_staff'])],
        ]);

        $results = $this->authService->bulkCreateFromEmailFile(
            $request->file('file'),
            $request->role,
            $request->user()->id
        );

        return response()->json([
            'message' => 'Bulk import completed.',
            'results' => $results,
        ]);
    }

    public function toggleActive(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);
        $user->update(['is_active' => !$user->is_active]);
        $this->auditService->log($user->is_active ? 'user_activated' : 'user_deactivated', $request->user()->id, 'User', $user->id);
        return response()->json(['message' => 'User status updated.', 'is_active' => $user->is_active]);
    }
}
