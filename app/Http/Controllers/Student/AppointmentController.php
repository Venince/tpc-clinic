<?php
namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentSlot;
use App\Support\PhilippineHolidays;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    private function isStudent(Request $request): bool
    {
        return $request->user()->role->name === 'student';
    }

    private function indexPage(Request $request): string
    {
        return $this->isStudent($request) ? 'Student/Appointments/Index' : 'Faculty/Appointments/Index';
    }

    private function calendarPage(Request $request): string
    {
        return $this->isStudent($request) ? 'Student/Appointments/Calendar' : 'Faculty/Appointments/Calendar';
    }

    private function routePrefix(Request $request): string
    {
        return $this->isStudent($request) ? 'student' : 'faculty';
    }

    public function index(Request $request)
    {
        $appointments = Appointment::where('user_id',$request->user()->id)->with('slot')->latest()->paginate(10);
        $slots = AppointmentSlot::where('is_available',true)->where('date','>=',today())
            ->withCount('appointments')->orderBy('date')->orderBy('start_time')
            ->get()->filter(fn($s)=>!$s->isFullyBooked())->values();

        return Inertia::render($this->indexPage($request), compact('appointments','slots'));
    }

    public function calendar(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));
        [$year, $m] = explode('-', $month);
        $userId = $request->user()->id;

        // The logged-in user's own appointments that fall in this month, grouped by date.
        $appointments = Appointment::where('user_id', $userId)
            ->whereHas('slot', fn($q) => $q->whereYear('date', $year)->whereMonth('date', $m))
            ->with('slot')
            ->get();

        $appointmentsByDate = $appointments
            ->filter(fn($a) => $a->slot)
            ->groupBy(fn($a) => $a->slot->date->toDateString())
            ->map(fn($group) => $group->map(fn($a) => [
                'id'             => $a->id,
                'purpose'        => $a->purpose,
                'status'         => $a->status,
                'decline_reason' => $a->decline_reason,
                'start_time'     => $a->slot->start_time,
                'end_time'       => $a->slot->end_time,
            ])->values());

        // Bookable slots for this month — only future, open, not-full slots.
        $slots = AppointmentSlot::whereYear('date', $year)->whereMonth('date', $m)
            ->where('is_available', true)
            ->where('date', '>=', today())
            ->withCount('appointments')
            ->orderBy('date')->orderBy('start_time')
            ->get()
            ->filter(fn($s) => !$s->isFullyBooked())
            ->values();

        $slotsByDate = $slots
            ->groupBy(fn($s) => $s->date->toDateString())
            ->map(fn($group) => $group->map(fn($s) => [
                'id'                => $s->id,
                'start_time'        => $s->start_time,
                'end_time'          => $s->end_time,
                'available_slots'   => $s->availableSlots(),
                'max_appointments'  => $s->max_appointments,
            ])->values());

        return Inertia::render($this->calendarPage($request), [
            'appointmentsByDate' => $appointmentsByDate,
            'slotsByDate'        => $slotsByDate,
            'month'              => $month,
            'currentDate'        => now()->toDateString(),
            'routePrefix'        => $this->routePrefix($request),
            'holidays'           => array_merge(
                PhilippineHolidays::getHolidaysForYear((int) $year),
                PhilippineHolidays::getHolidaysForYear((int) $year + 1),
            ),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'appointment_slot_id' => ['required','exists:appointment_slots,id'],
            'purpose'             => ['required','string','max:255'],
            'notes'               => ['nullable','string'],
        ]);

        $slot = AppointmentSlot::lockForUpdate()->find($data['appointment_slot_id']);

        if (!$slot || !$slot->is_available || $slot->isFullyBooked()) {
            return back()->with('error','This slot is not available.');
        }
        if (Appointment::where('user_id',$request->user()->id)->where('appointment_slot_id',$slot->id)->whereNotIn('status',['declined','cancelled'])->exists()) {
            return back()->with('error','You already have a booking for this slot.');
        }

        DB::transaction(function() use($data,$request,$slot) {
            Appointment::create(array_merge($data,['user_id'=>$request->user()->id,'status'=>'pending']));
            $slot->increment('booked_count');
            if ($slot->fresh()->isFullyBooked()) $slot->update(['is_available'=>false]);
        });

        return back()->with('success','Appointment booked successfully.');
    }

    public function cancel(Request $request, Appointment $appointment)
    {
        if ($appointment->user_id !== $request->user()->id) abort(403);
        if (!in_array($appointment->status,['pending','approved'])) return back()->with('error','This appointment cannot be cancelled.');

        $appointment->update(['status'=>'cancelled']);
        $appointment->slot->decrement('booked_count');
        if (!$appointment->slot->fresh()->isFullyBooked()) $appointment->slot->update(['is_available'=>true]);

        return back()->with('success','Appointment cancelled.');
    }
}