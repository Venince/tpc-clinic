<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\AppointmentSlot;
use App\Repositories\Contracts\AppointmentRepositoryInterface;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function __construct(
        private AppointmentService $appointmentService,
        private AppointmentRepositoryInterface $appointmentRepository,
    ) {}

    public function availableSlots(Request $request): JsonResponse
    {
        $slots = AppointmentSlot::where('is_available', true)
            ->where('date', '>=', today())
            ->when($request->date, fn($q) => $q->whereDate('date', $request->date))
            ->withCount('appointments')
            ->orderBy('date')->orderBy('start_time')
            ->get()
            ->filter(fn($s) => !$s->isFullyBooked())
            ->values();

        return response()->json(['data' => $slots]);
    }

    public function index(Request $request): JsonResponse
    {
        $appointments = $this->appointmentRepository->getByUser($request->user()->id);
        return response()->json(['data' => AppointmentResource::collection($appointments)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'appointment_slot_id' => ['required', 'integer', 'exists:appointment_slots,id'],
            'purpose'             => ['required', 'string', 'max:255'],
            'notes'               => ['nullable', 'string'],
        ]);

        $appointment = $this->appointmentService->book($data, $request->user()->id);
        return response()->json(['message' => 'Appointment booked successfully.', 'data' => new AppointmentResource($appointment)], 201);
    }

    public function cancel(Request $request, \App\Models\Appointment $appointment): JsonResponse
    {
        if ($appointment->user_id !== $request->user()->id) {
            abort(403);
        }

        if (!in_array($appointment->status, ['pending', 'approved'])) {
            return response()->json(['message' => 'This appointment cannot be cancelled.'], 422);
        }

        $updated = $this->appointmentService->updateStatus($appointment, 'cancelled', $request->user()->id);
        return response()->json(['message' => 'Appointment cancelled.', 'data' => new AppointmentResource($updated)]);
    }
}
