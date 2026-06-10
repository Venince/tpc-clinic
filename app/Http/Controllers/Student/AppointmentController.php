<?php
namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentSlot;
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
