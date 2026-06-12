<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\MedicineRequest;
use App\Notifications\MedicineRequestStatusNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicineController extends Controller
{
    public function index(Request $request)
    {
        $medicines = Medicine::when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->filter === 'low',  fn($q) => $q->where('quantity', '>', 0)->whereRaw('quantity <= reorder_level'))
            ->when($request->filter === 'out',  fn($q) => $q->where('quantity', 0))
            ->orderBy('name')->paginate(15)->withQueryString();

        return Inertia::render('Admin/Medicine/Index', [
            'medicines' => $medicines,
            'filters'   => $request->only('search', 'filter'),
            'stats'     => [
                'total'     => Medicine::where('is_active', true)->count(),
                'low_stock' => Medicine::where('is_active', true)->where('quantity', '>', 0)->whereRaw('quantity <= reorder_level')->count(),
                'out'       => Medicine::where('is_active', true)->where('quantity', 0)->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'unit'            => ['required', 'string', 'max:50'],
            'quantity'        => ['required', 'integer', 'min:0'],
            'reorder_level'   => ['required', 'integer', 'min:0'],
            'expiration_date' => ['nullable', 'date'],
            'batch_number'    => ['nullable', 'string'],
        ]);
        Medicine::create($data);
        return back()->with('success', 'Medicine added.');
    }

    public function update(Request $request, Medicine $medicine)
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'unit'            => ['required', 'string', 'max:50'],
            'quantity'        => ['required', 'integer', 'min:0'],
            'reorder_level'   => ['required', 'integer', 'min:0'],
            'expiration_date' => ['nullable', 'date'],
            'batch_number'    => ['nullable', 'string'],
        ]);
        $medicine->update($data);
        return back()->with('success', 'Medicine updated.');
    }

    public function destroy(Medicine $medicine)
    {
        if ($medicine->requests()->whereIn('status', ['pending', 'approved'])->exists()) {
            return back()->with('error', 'Cannot delete medicine with active requests.');
        }
        $medicine->delete();
        return back()->with('success', 'Medicine deleted.');
    }

    public function requests(Request $request)
    {
        $requests = MedicineRequest::with([
                'user:id,name,email,profile_photo_path',
                'medicine:id,name,unit',
                'reviewer:id,name',
            ])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Medicine/Requests', [
            'requests' => $requests,
            'filters'  => $request->only('status'),
            'stats'    => [
                'pending'  => MedicineRequest::where('status', 'pending')->count(),
                'approved' => MedicineRequest::where('status', 'approved')->count(),
                'released' => MedicineRequest::where('status', 'released')->count(),
            ],
        ]);
    }

    public function approveRequest(Request $request, MedicineRequest $medicineRequest)
    {
        if ($medicineRequest->status !== 'pending') return back()->with('error', 'Only pending requests can be approved.');
        $medicineRequest->update(['status' => 'approved', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        $medicineRequest->user->notify(new MedicineRequestStatusNotification($medicineRequest->load('medicine')));
        return back()->with('success', 'Request approved.');
    }

    public function rejectRequest(Request $request, MedicineRequest $medicineRequest)
    {
        $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $medicineRequest->update(['status' => 'rejected', 'rejection_reason' => $request->reason, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        $medicineRequest->user->notify(new MedicineRequestStatusNotification($medicineRequest->load('medicine')));
        return back()->with('success', 'Request rejected.');
    }

    public function releaseRequest(Request $request, MedicineRequest $medicineRequest)
    {
        $request->validate(['quantity_released' => ['required', 'integer', 'min:1']]);

        $medicine = Medicine::lockForUpdate()->find($medicineRequest->medicine_id);
        if ($medicine->quantity < $request->quantity_released) {
            return back()->with('error', "Only {$medicine->quantity} {$medicine->unit} available.");
        }

        $medicine->decrement('quantity', $request->quantity_released);
        $medicineRequest->update(['status' => 'released', 'quantity_released' => $request->quantity_released, 'released_at' => now()]);
        $medicineRequest->user->notify(new MedicineRequestStatusNotification($medicineRequest->load('medicine')));
        return back()->with('success', 'Medicine released.');
    }

    public function destroyRequest(MedicineRequest $medicineRequest)
    {
        $medicineRequest->delete();
        return back()->with('success', 'Medicine request deleted.');
    }
}
