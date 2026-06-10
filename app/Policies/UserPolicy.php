<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdminOrHigher();
    }

    public function view(User $user, User $model): bool
    {
        return $user->id === $model->id || $user->isAdminOrHigher();
    }

    public function create(User $user): bool
    {
        return $user->isAdminOrHigher();
    }

    public function update(User $user, User $model): bool
    {
        // SuperAdmin can update anyone; Admin can update students/faculty but not other admins
        if ($user->isSuperAdmin()) return true;
        if ($user->isAdmin()) return !$model->isAdminOrHigher() || $user->id === $model->id;
        return $user->id === $model->id;
    }

    public function delete(User $user, User $model): bool
    {
        if ($user->id === $model->id) return false;
        if ($user->isSuperAdmin()) return true;
        if ($user->isAdmin()) return !$model->isAdminOrHigher();
        return false;
    }
}
