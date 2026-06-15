<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\User;
use App\Models\WalkinLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalkinLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = WalkinLog::with([
                'user.role', 'user.studentProfile.program',
                'user.facultyProfile', 'loggedBy:id,name',
            ])
            ->when($request->search, fn($q) => $q->whereHas('user', fn($u) =>
                $u->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
            ))
            ->when($request->date_from, fn($q) => $q->whereDate('visited_at', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('visited_at', '<=', $request->date_to))
            ->when($request->user_type, fn($q) => $q->whereHas('user.role', fn($r) =>
                $r->where('name', $request->user_type)
            ))
            ->latest('visited_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/WalkinLog/Index', [
            'logs'    => $logs,
            'stats'   => [
                'today'      => WalkinLog::whereDate('visited_at', today())->count(),
                'this_month' => WalkinLog::whereMonth('visited_at', now()->month)
                                    ->whereYear('visited_at', now()->year)->count(),
                'total'      => WalkinLog::count(),
            ],
            'users' => User::with('role')
                ->whereHas('role', fn($q) => $q->whereIn('name', ['student', 'faculty_staff']))
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role_id'])
                ->map(fn($u) => [
                    'id'    => $u->id,
                    'name'  => $u->name,
                    'email' => $u->email,
                    'role'  => $u->role->name,
                ]),
            'medicines' => Medicine::where('is_active', true)
                ->where('quantity', '>', 0)
                ->orderBy('name')
                ->get(['id', 'name', 'unit', 'quantity']),
            'filters' => $request->only('search', 'date_from', 'date_to', 'user_type'),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'                           => ['required', 'exists:users,id'],
            'visited_at'                        => ['required', 'date'],
            'chief_complaint'                   => ['required', 'string', 'max:500'],
            'vital_signs'                       => ['nullable', 'array'],
            'vital_signs.blood_pressure'        => ['nullable', 'string', 'max:20'],
            'vital_signs.temperature'           => ['nullable', 'string', 'max:10'],
            'vital_signs.weight'                => ['nullable', 'string', 'max:10'],
            'vital_signs.pulse_rate'            => ['nullable', 'string', 'max:10'],
            'vital_signs.o2_saturation'         => ['nullable', 'string', 'max:10'],
            'diagnosis'                         => ['nullable', 'string', 'max:1000'],
            'treatment'                         => ['nullable', 'string', 'max:1000'],
            'medicines_dispensed'               => ['nullable', 'array'],
            'medicines_dispensed.*.medicine_id' => ['required', 'exists:medicines,id'],
            'medicines_dispensed.*.quantity'    => ['required', 'integer', 'min:1'],
            'notes'                             => ['nullable', 'string', 'max:2000'],
        ]);

        // Validate stock and deduct
        $dispensed = [];
        foreach ($data['medicines_dispensed'] ?? [] as $item) {
            $medicine = Medicine::findOrFail($item['medicine_id']);
            if ($medicine->quantity < $item['quantity']) {
                return back()->withErrors([
                    'medicines_dispensed' => "Insufficient stock for {$medicine->name}. Available: {$medicine->quantity} {$medicine->unit}.",
                ]);
            }
            $dispensed[] = [
                'medicine_id' => $medicine->id,
                'name'        => $medicine->name,
                'quantity'    => $item['quantity'],
                'unit'        => $medicine->unit,
            ];
            $medicine->decrement('quantity', $item['quantity']);
        }

        WalkinLog::create([
            'user_id'             => $data['user_id'],
            'logged_by'           => $request->user()->id,
            'visited_at'          => $data['visited_at'],
            'chief_complaint'     => $data['chief_complaint'],
            'vital_signs'         => $data['vital_signs']  ?? null,
            'diagnosis'           => $data['diagnosis']    ?? null,
            'treatment'           => $data['treatment']    ?? null,
            'medicines_dispensed' => !empty($dispensed) ? $dispensed : null,
            'notes'               => $data['notes']        ?? null,
        ]);

        return back()->with('success', 'Walk-in log recorded successfully.');
    }

    public function destroy(Request $request, WalkinLog $walkinLog)
    {
        abort_unless($request->user()->isSuperAdmin(), 403);
        $walkinLog->delete();
        return back()->with('success', 'Walk-in log deleted.');
    }
}