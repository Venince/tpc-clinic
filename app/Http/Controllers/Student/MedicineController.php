<?php
namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\MedicineRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicineController extends Controller
{
    private function page(Request $request): string
    {
        return $request->user()->role->name === 'student' ? 'Student/Medicine/Index' : 'Faculty/Medicine/Index';
    }

    public function index(Request $request)
    {
        return Inertia::render($this->page($request), [
            'medicines'  => Medicine::where('is_active', true)->where('quantity', '>', 0)->select('id','name','description','unit','quantity')->orderBy('name')->get(),
            'myRequests' => MedicineRequest::where('user_id', $request->user()->id)->with('medicine:id,name,unit')->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'medicine_id'        => ['required','exists:medicines,id'],
            'quantity_requested' => ['required','integer','min:1'],
            'reason'             => ['required','string','max:500'],
        ]);

        $medicine = Medicine::findOrFail($data['medicine_id']);
        if ($medicine->is_out_of_stock) return back()->with('error', 'This medicine is currently out of stock.');

        MedicineRequest::create(array_merge($data, ['user_id' => $request->user()->id, 'status' => 'pending']));
        return back()->with('success', 'Medicine requested successfully.');
    }

    public function cancel(Request $request, MedicineRequest $medicineRequest)
    {
        abort_unless($medicineRequest->user_id === $request->user()->id, 403);
        abort_unless($medicineRequest->status === 'pending', 403, 'Only pending requests can be cancelled.');

        $medicineRequest->update(['status' => 'cancelled']);
        return back()->with('success', 'Medicine request cancelled.');
    }

    public function destroy(Request $request, MedicineRequest $medicineRequest)
    {
        abort_unless($medicineRequest->user_id === $request->user()->id, 403);

        // Prevent deletion of active requests — cancel first
        abort_unless(
            in_array($medicineRequest->status, ['cancelled', 'rejected', 'released']),
            403,
            'Only cancelled, rejected, or released requests can be deleted. Please cancel it first.'
        );

        $medicineRequest->delete();
        return back()->with('success', 'Request removed.');
    }
}
