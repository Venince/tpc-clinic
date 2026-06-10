<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentSlotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'date'              => $this->date->toDateString(),
            'start_time'        => $this->start_time,
            'end_time'          => $this->end_time,
            'max_appointments'  => $this->max_appointments,
            'booked_count'      => $this->booked_count,
            'available_slots'   => $this->availableSlots(),
            'is_available'      => $this->is_available,
            'is_fully_booked'   => $this->isFullyBooked(),
            'notes'             => $this->notes,
            'created_at'        => $this->created_at,
        ];
    }
}
