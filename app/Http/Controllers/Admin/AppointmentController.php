<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentSlot;
use App\Notifications\AppointmentStatusNotification;
use App\Rules\NotWeekendOrHoliday;
use App\Support\PhilippineHolidays;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $appointments = Appointment::with(['user:id,name,email', 'slot', 'reviewer:id,name'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->date,   fn($q) => $q->whereHas('slot', fn($s) => $s->whereDate('date', $request->date)))
            ->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Appointments/Index', [
            'appointments' => $appointments,
            'filters'      => $request->only('status', 'date'),
            'isSuperAdmin' => $request->user()->isSuperAdmin(),
            'stats'        => [
                'pending'   => Appointment::where('status', 'pending')->count(),
                'approved'  => Appointment::where('status', 'approved')->count(),
                'declined'  => Appointment::where('status', 'declined')->count(),
                'completed' => Appointment::where('status', 'completed')->count(),
            ],
        ]);
    }

    public function calendar(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));
        [$year, $m] = explode('-', $month);

        $slots = AppointmentSlot::whereYear('date', $year)->whereMonth('date', $m)
            ->withCount([
                'appointments as pending_count'  => fn($q) => $q->where('status', 'pending'),
                'appointments as approved_count' => fn($q) => $q->where('status', 'approved'),
            ])
            ->orderBy('date')->orderBy('start_time')->get();

        return Inertia::render('Admin/Appointments/Calendar', [
            'slots'        => $slots->groupBy(fn($s) => $s->date->toDateString()),
            'month'        => $month,
            'currentDate'  => now()->toDateString(),
            'isSuperAdmin' => $request->user()->isSuperAdmin(),
            'holidays'     => array_merge(
                PhilippineHolidays::getHolidaysForYear((int) $year),
                PhilippineHolidays::getHolidaysForYear((int) $year + 1),
            ),
        ]);
    }

    public function slotStore(Request $request)
    {
        $data = $request->validate([
            'date'             => ['required', 'date', 'after_or_equal:today', new NotWeekendOrHoliday],
            'start_time'       => ['required', 'date_format:H:i'],
            'end_time'         => ['required', 'date_format:H:i', 'after:start_time'],
            'max_appointments' => ['required', 'integer', 'min:1'],
            'notes'            => ['nullable', 'string'],
        ]);

        AppointmentSlot::create(array_merge($data, ['created_by' => $request->user()->id]));

        return back()->with('success', 'Slot created.');
    }

    public function slotDestroy(AppointmentSlot $slot)
    {
        if ($slot->appointments()->whereIn('status', ['pending', 'approved'])->exists()) {
            return back()->with('error', 'Cannot delete a slot with active appointments.');
        }
        $slot->delete();
        return back()->with('success', 'Slot deleted.');
    }

    public function approve(Request $request, Appointment $appointment)
    {
        $appointment->update(['status' => 'approved', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        $appointment->user->notify(new AppointmentStatusNotification($appointment->load('slot')));
        return back()->with('success', 'Appointment approved.');
    }

    public function decline(Request $request, Appointment $appointment)
    {
        $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $appointment->update(['status' => 'declined', 'decline_reason' => $request->reason, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);

        // Free the slot
        $appointment->slot->decrement('booked_count');
        if (!$appointment->slot->fresh()->isFullyBooked()) {
            $appointment->slot->update(['is_available' => true]);
        }

        $appointment->user->notify(new AppointmentStatusNotification($appointment->load('slot')));
        return back()->with('success', 'Appointment declined.');
    }

    public function complete(Request $request, Appointment $appointment)
    {
        $appointment->update(['status' => 'completed', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        return back()->with('success', 'Appointment marked as completed.');
    }

    public function destroyAppointment(Appointment $appointment)
    {
        if (in_array($appointment->status, ['pending', 'approved'])) {
            return back()->with('error', 'Cannot delete an active appointment. Decline it first.');
        }
        $appointment->delete();
        return back()->with('success', 'Appointment deleted.');
    }
}