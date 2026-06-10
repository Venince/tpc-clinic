<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->user_id || $user->isAdminOrHigher();
    }

    public function create(User $user): bool
    {
        return true; // All authenticated users can book
    }

    public function update(User $user, Appointment $appointment): bool
    {
        return $user->isAdminOrHigher();
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        return $user->isAdminOrHigher();
    }

    public function cancel(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->user_id && in_array($appointment->status, ['pending', 'approved']);
    }

    public function approve(User $user, Appointment $appointment): bool
    {
        return $user->isAdminOrHigher() && $appointment->status === 'pending';
    }

    public function decline(User $user, Appointment $appointment): bool
    {
        return $user->isAdminOrHigher() && $appointment->status === 'pending';
    }
}
