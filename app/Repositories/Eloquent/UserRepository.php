<?php
namespace App\Repositories\Eloquent;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryInterface
{
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->with('role')->first();
    }

    public function findById(int $id): ?User
    {
        return User::with('role')->find($id);
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return User::with(['role', 'studentProfile', 'facultyProfile'])
            ->when(isset($filters['role']),          fn($q) => $q->whereHas('role', fn($r) => $r->where('name', $filters['role'])))
            ->when(isset($filters['search']),        fn($q) => $q->where(fn($s) => $s->where('name', 'like', "%{$filters['search']}%")->orWhere('email', 'like', "%{$filters['search']}%")))
            ->when(isset($filters['is_active']),     fn($q) => $q->where('is_active', $filters['is_active']))
            ->when(isset($filters['exclude_roles']), fn($q) => $q->whereHas('role', fn($r) => $r->whereNotIn('name', $filters['exclude_roles'])))
            ->latest()->paginate($perPage);
    }

    public function create(array $data): User { return User::create($data); }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh('role');
    }

    public function delete(User $user): bool { return $user->delete(); }
}
