<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicineRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'quantity_requested'  => $this->quantity_requested,
            'quantity_released'   => $this->quantity_released,
            'reason'              => $this->reason,
            'status'              => $this->status,
            'rejection_reason'    => $this->rejection_reason,
            'reviewed_at'         => $this->reviewed_at,
            'released_at'         => $this->released_at,
            'created_at'          => $this->created_at,
            'medicine'            => $this->whenLoaded('medicine', fn() => ['id' => $this->medicine->id, 'name' => $this->medicine->name, 'unit' => $this->medicine->unit]),
            'user'                => $this->whenLoaded('user', fn() => ['id' => $this->user->id, 'name' => $this->user->name]),
        ];
    }
}
