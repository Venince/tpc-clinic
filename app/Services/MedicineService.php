<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\MedicineRequest;
use App\Notifications\MedicineRequestStatusNotification;
use App\Notifications\LowStockAlertNotification;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MedicineService
{
    public function __construct(private AuditService $auditService) {}

    public function create(array $data, int $adminId): Medicine
    {
        $medicine = Medicine::create($data);
        $this->auditService->log('medicine_created', $adminId, 'Medicine', $medicine->id, null, $data);
        return $medicine;
    }

    public function update(Medicine $medicine, array $data, int $adminId): Medicine
    {
        $old = $medicine->toArray();
        $medicine->update($data);
        $this->auditService->log('medicine_updated', $adminId, 'Medicine', $medicine->id, $old, $data);
        return $medicine->fresh();
    }

    public function delete(Medicine $medicine, int $adminId): void
    {
        if ($medicine->requests()->whereIn('status', ['pending', 'approved'])->exists()) {
            throw ValidationException::withMessages(['medicine' => ['Cannot delete medicine with active requests.']]);
        }
        $this->auditService->log('medicine_deleted', $adminId, 'Medicine', $medicine->id);
        $medicine->delete();
    }

    public function requestMedicine(array $data, int $userId): MedicineRequest
    {
        $medicine = Medicine::findOrFail($data['medicine_id']);

        if ($medicine->is_low_stock || $medicine->is_out_of_stock) {
            throw ValidationException::withMessages(['medicine_id' => ['This medicine is out of stock.']]);
        }

        $request = MedicineRequest::create(array_merge($data, ['user_id' => $userId, 'status' => 'pending']));
        $this->auditService->log('medicine_requested', $userId, 'MedicineRequest', $request->id);

        $loaded = $request->load('medicine', 'user');

        $admins = User::whereHas('role', fn($q) => $q->whereIn('name', ['admin', 'super_admin']))->get();
        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\NewMedicineRequestNotification($loaded));
        }

        return $loaded;
}

    public function approveRequest(MedicineRequest $medicineRequest, int $adminId): MedicineRequest
    {
        if ($medicineRequest->status !== 'pending') {
            throw ValidationException::withMessages(['request' => ['Only pending requests can be approved.']]);
        }

        $medicineRequest->update([
            'status'      => 'approved',
            'reviewed_by' => $adminId,
            'reviewed_at' => now(),
        ]);

        $medicineRequest->user->notify(new MedicineRequestStatusNotification($medicineRequest));
        $this->auditService->log('medicine_request_approved', $adminId, 'MedicineRequest', $medicineRequest->id);
        return $medicineRequest->fresh('medicine', 'user');
    }

    public function rejectRequest(MedicineRequest $medicineRequest, int $adminId, string $reason): MedicineRequest
    {
        if ($medicineRequest->status !== 'pending') {
            throw ValidationException::withMessages(['request' => ['Only pending requests can be rejected.']]);
        }

        $medicineRequest->update([
            'status'           => 'rejected',
            'rejection_reason' => $reason,
            'reviewed_by'      => $adminId,
            'reviewed_at'      => now(),
        ]);

        $medicineRequest->user->notify(new MedicineRequestStatusNotification($medicineRequest));
        $this->auditService->log('medicine_request_rejected', $adminId, 'MedicineRequest', $medicineRequest->id);
        return $medicineRequest->fresh('medicine', 'user');
    }

    public function releaseMedicine(MedicineRequest $req, int $adminId, int $quantityReleased): MedicineRequest
    {
        if ($req->status !== 'approved') {
            throw ValidationException::withMessages(['request' => ['Only approved requests can be released.']]);
        }

        $medicine = Medicine::lockForUpdate()->find($req->medicine_id);

        if ($medicine->quantity < $quantityReleased) {
            throw ValidationException::withMessages(['quantity' => ["Only {$medicine->quantity} units available."]]);
        }

        DB::transaction(function () use ($req, $adminId, $quantityReleased, $medicine) {
            $medicine->decrement('quantity', $quantityReleased);

            $req->update([
                'status'            => 'released',
                'quantity_released' => $quantityReleased,
                'released_at'       => now(),
            ]);

            // Low stock check after release
            $fresh = $medicine->fresh();
            if ($fresh->isLowStock() || $fresh->isOutOfStock()) {
                $admins = User::whereHas('role', fn($q) => $q->whereIn('name', ['admin', 'super_admin']))->get();
                foreach ($admins as $admin) {
                    $admin->notify(new LowStockAlertNotification($fresh));
                }
            }
        });

        $req->user->notify(new MedicineRequestStatusNotification($req->fresh()));
        $this->auditService->log('medicine_released', $adminId, 'MedicineRequest', $req->id);
        return $req->fresh('medicine', 'user');
    }

    public function getLowStockMedicines(): \Illuminate\Database\Eloquent\Collection
    {
        return Medicine::where('is_active', true)
            ->where('quantity', '>', 0)
            ->whereRaw('quantity <= reorder_level')
            ->get();
    }

    public function getOutOfStockMedicines(): \Illuminate\Database\Eloquent\Collection
    {
        return Medicine::where('is_active', true)->where('quantity', 0)->get();
    }
}
