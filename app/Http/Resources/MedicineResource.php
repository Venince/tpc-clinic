<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'description'     => $this->description,
            'unit'            => $this->unit,
            'quantity'        => $this->quantity,
            'reorder_level'   => $this->reorder_level,
            'expiration_date' => $this->expiration_date?->toDateString(),
            'batch_number'    => $this->batch_number,
            'is_active'       => $this->is_active,
            'is_low_stock'    => $this->is_low_stock,
            'is_out_of_stock' => $this->is_out_of_stock,
            'is_expired'      => $this->is_expired,
            'created_at'      => $this->created_at,
        ];
    }
}
