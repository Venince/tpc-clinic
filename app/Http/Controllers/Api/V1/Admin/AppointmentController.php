<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\AppointmentSlotResource;
use App\Models\Appointment;
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

    // Slots
    public function indexSlots(Request $request): JsonResponse
    {
        $slots = AppointmentSlot::with('appointments')
            ->when($request->date,  fn($q) => $q->whereDate('date', $request->date))
            ->when($request->month, fn($q) => $q->whereMonth('date', explode('-', $request->month)[1])->whereYear('date', explode('-', $request->month)[0]))
            ->orderBy('date')->orderBy('start_time')
            ->paginate(20);

        return response()->json(['data' => AppointmentSlotResource::collection($slots)]);
    }

    public function storeSlot(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date'               => ['required', 'date', 'after_or_equal:today'],
            'start_time'         => ['required', 'date_format:H:i'],
            'end_time'           => ['required', 'date_format:H:i', 'after:start_time'],
            'max_appointments'   => ['required', 'integer', 'min:1'],
            'notes'              => ['nullable', 'string'],
        ]);

        $slot = $this->appointmentService->createSlot($data, $request->user()->id);
        return response()->json(['message' => 'Slot created.', 'data' => new AppointmentSlotResource($slot)], 201);
    }

    public function updateSlot(Request $request, AppointmentSlot $slot): JsonResponse
    {
        $data = $request->validate([
            'date'             => ['sometimes', 'date'],
            'start_time'       => ['sometimes', 'date_format:H:i'],
            'end_time'         => ['sometimes', 'date_format:H:i'],
            'max_appointments' => ['sometimes', 'integer', 'min:1'],
            'is_available'     => ['sometimes', 'boolean'],
            'notes'            => ['nullable', 'string'],
        ]);

        $slot = $this->appointmentService->updateSlot($slot, $data, $request->user()->id);
        return response()->json(['message' => 'Slot updated.', 'data' => new AppointmentSlotResource($slot)]);
    }

    public function destroySlot(Request $request, AppointmentSlot $slot): JsonResponse
    {
        $this->appointmentService->deleteSlot($slot, $request->user()->id);
        return response()->json(['message' => 'Slot deleted.']);
    }

    // Appointments
    public function index(Request $request): JsonResponse
    {
        $appointments = $this->appointmentRepository->paginate($request->only('status', 'date', 'user_id'));
        return response()->json(['data' => AppointmentResource::collection($appointments), 'meta' => [
            'current_page' => $appointments->currentPage(),
            'last_page'    => $appointments->lastPage(),
            'total'        => $appointments->total(),
        ]]);
    }

    public function show(Appointment $appointment): JsonResponse
    {
        return response()->json(['data' => new AppointmentResource($appointment->load('user', 'slot', 'reviewer'))]);
    }

    public function approve(Request $request, Appointment $appointment): JsonResponse
    {
        $updated = $this->appointmentService->updateStatus($appointment, 'approved', $request->user()->id);
        return response()->json(['message' => 'Appointment approved.', 'data' => new AppointmentResource($updated)]);
    }

    public function decline(Request $request, Appointment $appointment): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $updated = $this->appointmentService->updateStatus($appointment, 'declined', $request->user()->id, $data['reason']);
        return response()->json(['message' => 'Appointment declined.', 'data' => new AppointmentResource($updated)]);
    }

    public function complete(Request $request, Appointment $appointment): JsonResponse
    {
        $updated = $this->appointmentService->updateStatus($appointment, 'completed', $request->user()->id);
        return response()->json(['message' => 'Appointment marked as completed.', 'data' => new AppointmentResource($updated)]);
    }

    public function calendar(Request $request): JsonResponse
    {
        $request->validate(['month' => ['required', 'date_format:Y-m']]);
        $calendar = $this->appointmentService->getCalendar($request->month);
        return response()->json(['data' => $calendar]);
    }

    public function stats(): JsonResponse
    {
        return response()->json(['data' => $this->appointmentService->getStats()]);
    }
}
