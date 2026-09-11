<?php
namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentSlot;
use App\Services\AppointmentService;
use App\Support\PhilippineHolidays;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    public function __construct(private AppointmentService $appointmentService) {}

    private function isStudent(Request $request): bool
    {
        return $request->user()->role->name === 'student';
    }

    private function calendarPage(Request $request): string
    {
        return $this->isStudent($request) ? 'Student/Appointments/Calendar' : 'Faculty/Appointments/Calendar';
    }

    private function listPage(Request $request): string
    {
        return $this->isStudent($request) ? 'Student/Appointments/Index' : 'Faculty/Appointments/Index';
    }

    private function routePrefix(Request $request): string
    {
        return $this->isStudent($request) ? 'student' : 'faculty';
    }

    /**
     * Default appointments landing page — the calendar.
     */
    public function index(Request $request)
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

        // All open, bookable future slots (used both for the month grid and the
        // "Book Appointment" quick-pick dropdown that's always available on this page).
        $openSlots = AppointmentSlot::where('is_available', true)
            ->where('date', '>=', today())
            ->withCount('appointments')
            ->orderBy('date')->orderBy('start_time')
            ->get()
            ->filter(fn($s) => !$s->isFullyBooked())
            ->values();

        $slotsByDate = $openSlots
            ->filter(fn($s) => $s->date->format('Y-m') === $month)
            ->groupBy(fn($s) => $s->date->toDateString())
            ->map(fn($group) => $group->map(fn($s) => [
                'id'                => $s->id,
                'start_time'        => $s->start_time,
                'end_time'          => $s->end_time,
                'available_slots'   => $s->availableSlots(),
                'max_appointments'  => $s->max_appointments,
            ])->values());

        $slots = $openSlots->map(fn($s) => [
            'id'                => $s->id,
            'date'              => $s->date->toDateString(),
            'start_time'        => $s->start_time,
            'end_time'          => $s->end_time,
            'available_slots'   => $s->availableSlots(),
            'max_appointments'  => $s->max_appointments,
            'booked_count'      => $s->booked_count,
        ])->values();

        return Inertia::render($this->calendarPage($request), [
            'appointmentsByDate' => $appointmentsByDate,
            'slotsByDate'        => $slotsByDate,
            'slots'              => $slots,
            'month'              => $month,
            'currentDate'        => now()->toDateString(),
            'routePrefix'        => $this->routePrefix($request),
            'holidays'           => array_merge(
                PhilippineHolidays::getHolidaysForYear((int) $year),
                PhilippineHolidays::getHolidaysForYear((int) $year + 1),
            ),
        ]);
    }

    /**
     * Table / list view of the user's appointments.
     */
    public function list(Request $request)
    {
        $appointments = Appointment::where('user_id',$request->user()->id)->with('slot')->latest()->paginate(10);
        $slots = AppointmentSlot::where('is_available',true)->where('date','>=',today())
            ->withCount('appointments')->orderBy('date')->orderBy('start_time')
            ->get()->filter(fn($s)=>!$s->isFullyBooked())->values();

        return Inertia::render($this->listPage($request), compact('appointments','slots'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'appointment_slot_id' => ['required','exists:appointment_slots,id'],
            'purpose'             => ['required','string','max:255'],
            'notes'               => ['nullable','string'],
        ]);

        $this->appointmentService->book($data, $request->user()->id);

        return back()->with('success', 'Appointment booked successfully.');
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