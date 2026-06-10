<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'purpose'        => $this->purpose,
            'notes'          => $this->notes,
            'status'         => $this->status,
            'decline_reason' => $this->decline_reason,
            'reviewed_at'    => $this->reviewed_at,
            'created_at'     => $this->created_at,
            'slot'           => $this->whenLoaded('slot', fn() => [
                'id'          => $this->slot->id,
                'date'        => $this->slot->date->toDateString(),
                'start_time'  => $this->slot->start_time,
                'end_time'    => $this->slot->end_time,
            ]),
            'user'           => $this->whenLoaded('user', fn() => ['id' => $this->user->id, 'name' => $this->user->name, 'email' => $this->user->email]),
            'reviewer'       => $this->whenLoaded('reviewer', fn() => $this->reviewer ? ['id' => $this->reviewer->id, 'name' => $this->reviewer->name] : null),
        ];
    }
}
