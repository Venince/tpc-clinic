<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AppointmentSlot;
use App\Notifications\AppointmentStatusNotification;
use App\Repositories\Contracts\AppointmentRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function __construct(
        private AppointmentRepositoryInterface $appointmentRepository,
        private AuditService $auditService,
    ) {}

    public function createSlot(array $data, int $adminId): AppointmentSlot
    {
        $slot = AppointmentSlot::create(array_merge($data, ['created_by' => $adminId]));
        $this->auditService->log('slot_created', $adminId, 'AppointmentSlot', $slot->id, null, $data);
        return $slot;
    }

    public function updateSlot(AppointmentSlot $slot, array $data, int $adminId): AppointmentSlot
    {
        $old = $slot->toArray();
        $slot->update($data);
        $this->auditService->log('slot_updated', $adminId, 'AppointmentSlot', $slot->id, $old, $data);
        return $slot->fresh();
    }

    public function deleteSlot(AppointmentSlot $slot, int $adminId): void
    {
        if ($slot->appointments()->whereIn('status', ['pending', 'approved'])->exists()) {
            throw ValidationException::withMessages([
                'slot' => ['Cannot delete a slot that has active appointments.'],
            ]);
        }
        $this->auditService->log('slot_deleted', $adminId, 'AppointmentSlot', $slot->id);
        $slot->delete();
    }

    public function book(array $data, int $userId): Appointment
    {
        $slot = AppointmentSlot::lockForUpdate()->find($data['appointment_slot_id']);

        if (!$slot || !$slot->is_available) {
            throw ValidationException::withMessages(['slot' => ['This slot is not available.']]);
        }

        if ($slot->isFullyBooked()) {
            throw ValidationException::withMessages(['slot' => ['This slot is fully booked.']]);
        }

        // Prevent duplicate booking
        $exists = Appointment::where('user_id', $userId)
            ->where('appointment_slot_id', $slot->id)
            ->whereNotIn('status', ['declined', 'cancelled'])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages(['slot' => ['You already have a booking for this slot.']]);
        }

        return DB::transaction(function () use ($data, $userId, $slot) {
            $appointment = Appointment::create(array_merge($data, [
                'user_id' => $userId,
                'status'  => 'pending',
            ]));

            $slot->increment('booked_count');
            if ($slot->fresh()->isFullyBooked()) {
                $slot->update(['is_available' => false]);
            }

            $this->auditService->log('appointment_booked', $userId, 'Appointment', $appointment->id);
            return $appointment->load('slot', 'user');
        });
    }

    public function updateStatus(Appointment $appointment, string $status, int $adminId, ?string $reason = null): Appointment
    {
        $old = ['status' => $appointment->status];

        DB::transaction(function () use ($appointment, $status, $adminId, $reason) {
            $appointment->update([
                'status'         => $status,
                'decline_reason' => $reason,
                'reviewed_by'    => $adminId,
                'reviewed_at'    => now(),
            ]);

            // Free up the slot if declined/cancelled
            if (in_array($status, ['declined', 'cancelled'])) {
                $slot = $appointment->slot;
                $slot->decrement('booked_count');
                if (!$slot->isFullyBooked()) {
                    $slot->update(['is_available' => true]);
                }
            }
        });

        // Notify user
        $appointment->user->notify(new AppointmentStatusNotification($appointment));

        $this->auditService->log("appointment_{$status}", $adminId, 'Appointment', $appointment->id,
            $old, ['status' => $status, 'reason' => $reason]);

        return $appointment->fresh('slot', 'user');
    }

    public function getCalendar(string $month): array
    {
        [$year, $m] = explode('-', $month);
        $slots = AppointmentSlot::whereYear('date', $year)
            ->whereMonth('date', $m)
            ->withCount(['appointments as pending_count' => fn($q) => $q->where('status', 'pending')])
            ->withCount(['appointments as approved_count' => fn($q) => $q->where('status', 'approved')])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return $slots->groupBy(fn($s) => $s->date->toDateString())->toArray();
    }

    public function getStats(): array
    {
        return [
            'total'     => Appointment::count(),
            'pending'   => Appointment::where('status', 'pending')->count(),
            'approved'  => Appointment::where('status', 'approved')->count(),
            'declined'  => Appointment::where('status', 'declined')->count(),
            'completed' => Appointment::where('status', 'completed')->count(),
        ];
    }
}
