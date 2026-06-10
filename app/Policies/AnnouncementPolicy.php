<?php

namespace App\Policies;

use App\Models\Announcement;
use App\Models\User;

class AnnouncementPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdminOrHigher();
    }

    public function create(User $user): bool
    {
        return $user->isAdminOrHigher();
    }

    public function update(User $user, Announcement $announcement): bool
    {
        return $user->isAdminOrHigher();
    }

    public function delete(User $user, Announcement $announcement): bool
    {
        return $user->isAdminOrHigher();
    }
}
