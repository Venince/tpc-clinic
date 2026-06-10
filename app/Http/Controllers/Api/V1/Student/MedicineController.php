<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\MedicineRequestResource;
use App\Models\Medicine;
use App\Models\MedicineRequest;
use App\Services\MedicineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicineController extends Controller
{
    public function __construct(private MedicineService $medicineService) {}

    public function available(): JsonResponse
    {
        $medicines = Medicine::where('is_active', true)->where('quantity', '>', 0)->select('id', 'name', 'description', 'unit', 'quantity')->get();
        return response()->json(['data' => $medicines]);
    }

    public function myRequests(Request $request): JsonResponse
    {
        $requests = MedicineRequest::where('user_id', $request->user()->id)->with('medicine')->latest()->get();
        return response()->json(['data' => MedicineRequestResource::collection($requests)]);
    }

    public function request(Request $request): JsonResponse
    {
        $data = $request->validate([
            'medicine_id'        => ['required', 'integer', 'exists:medicines,id'],
            'quantity_requested' => ['required', 'integer', 'min:1'],
            'reason'             => ['required', 'string', 'max:500'],
        ]);

        $medicineRequest = $this->medicineService->requestMedicine($data, $request->user()->id);
        return response()->json(['message' => 'Medicine requested.', 'data' => new MedicineRequestResource($medicineRequest)], 201);
    }
}
