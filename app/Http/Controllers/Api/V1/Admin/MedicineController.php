<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\MedicineResource;
use App\Http\Resources\MedicineRequestResource;
use App\Models\Medicine;
use App\Models\MedicineRequest;
use App\Services\MedicineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicineController extends Controller
{
    public function __construct(private MedicineService $medicineService) {}

    public function index(Request $request): JsonResponse
    {
        $medicines = Medicine::when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->low_stock,    fn($q) => $q->whereRaw('quantity <= reorder_level')->where('quantity', '>', 0))
            ->when($request->out_of_stock, fn($q) => $q->where('quantity', 0))
            ->orderBy('name')
            ->paginate(20);

        return response()->json(['data' => MedicineResource::collection($medicines)]);
    }

    public function show(Medicine $medicine): JsonResponse
    {
        return response()->json(['data' => new MedicineResource($medicine)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'unit'            => ['required', 'string', 'max:50'],
            'quantity'        => ['required', 'integer', 'min:0'],
            'reorder_level'   => ['required', 'integer', 'min:0'],
            'expiration_date' => ['nullable', 'date', 'after:today'],
            'batch_number'    => ['nullable', 'string', 'max:100'],
        ]);

        $medicine = $this->medicineService->create($data, $request->user()->id);
        return response()->json(['message' => 'Medicine added.', 'data' => new MedicineResource($medicine)], 201);
    }

    public function update(Request $request, Medicine $medicine): JsonResponse
    {
        $data = $request->validate([
            'name'            => ['sometimes', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'unit'            => ['sometimes', 'string', 'max:50'],
            'quantity'        => ['sometimes', 'integer', 'min:0'],
            'reorder_level'   => ['sometimes', 'integer', 'min:0'],
            'expiration_date' => ['nullable', 'date'],
            'batch_number'    => ['nullable', 'string'],
            'is_active'       => ['sometimes', 'boolean'],
        ]);

        $medicine = $this->medicineService->update($medicine, $data, $request->user()->id);
        return response()->json(['message' => 'Medicine updated.', 'data' => new MedicineResource($medicine)]);
    }

    public function destroy(Request $request, Medicine $medicine): JsonResponse
    {
        $this->medicineService->delete($medicine, $request->user()->id);
        return response()->json(['message' => 'Medicine deleted.']);
    }

    public function lowStock(): JsonResponse
    {
        return response()->json(['data' => MedicineResource::collection($this->medicineService->getLowStockMedicines())]);
    }

    public function outOfStock(): JsonResponse
    {
        return response()->json(['data' => MedicineResource::collection($this->medicineService->getOutOfStockMedicines())]);
    }

    // Medicine Requests
    public function requests(Request $request): JsonResponse
    {
        $requests = MedicineRequest::with(['user', 'medicine', 'reviewer'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()->paginate(20);

        return response()->json(['data' => MedicineRequestResource::collection($requests)]);
    }

    public function approveRequest(Request $request, MedicineRequest $medicineRequest): JsonResponse
    {
        $updated = $this->medicineService->approveRequest($medicineRequest, $request->user()->id);
        return response()->json(['message' => 'Request approved.', 'data' => new MedicineRequestResource($updated)]);
    }

    public function rejectRequest(Request $request, MedicineRequest $medicineRequest): JsonResponse
    {
        $data    = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $updated = $this->medicineService->rejectRequest($medicineRequest, $request->user()->id, $data['reason']);
        return response()->json(['message' => 'Request rejected.', 'data' => new MedicineRequestResource($updated)]);
    }

    public function releaseRequest(Request $request, MedicineRequest $medicineRequest): JsonResponse
    {
        $data    = $request->validate(['quantity_released' => ['required', 'integer', 'min:1']]);
        $updated = $this->medicineService->releaseMedicine($medicineRequest, $request->user()->id, $data['quantity_released']);
        return response()->json(['message' => 'Medicine released.', 'data' => new MedicineRequestResource($updated)]);
    }
}
