<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\User;
use App\Models\WalkinLog;
use App\Notifications\WalkinFollowUpNotification;
use App\Notifications\WalkinLogNotification;
use App\Support\PhilippineHolidays;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
                $request->user_type === 'admin'
                    ? $r->whereIn('name', ['admin', 'super_admin'])
                    : $r->where('name', $request->user_type)
            ))
            ->latest('visited_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/WalkinLog/Index', [
            'logs'      => $logs,
            'stats'     => [
                'today'      => WalkinLog::whereDate('visited_at', today())->count(),
                'this_month' => WalkinLog::whereMonth('visited_at', now()->month)
                                    ->whereYear('visited_at', now()->year)->count(),
                'total'      => WalkinLog::count(),
            ],
            'users'     => User::with('role')
                ->whereHas('role', fn($q) => $q->whereIn('name', ['student', 'faculty_staff', 'admin', 'super_admin']))
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
            'filters'   => $request->only('search', 'date_from', 'date_to', 'user_type'),
            'highlight' => $request->query('highlight'),
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

        $log = WalkinLog::create([
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

        // Notify the patient
        $patient = User::find($data['user_id']);
        $patient?->notify(new WalkinLogNotification($log));

        return back()->with('success', 'Walk-in log recorded successfully.');
    }

    public function update(Request $request, WalkinLog $walkinLog)
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

        try {
            DB::transaction(function () use ($data, $walkinLog) {
                // Return the previously dispensed quantities to stock before re-validating,
                // so editing a log doesn't permanently "lose" or double-count medicine.
                foreach ($walkinLog->medicines_dispensed ?? [] as $old) {
                    Medicine::whereKey($old['medicine_id'])->increment('quantity', $old['quantity']);
                }

                // Re-validate stock against the new list and build the dispensed snapshot.
                $dispensed = [];
                foreach ($data['medicines_dispensed'] ?? [] as $item) {
                    $medicine = Medicine::findOrFail($item['medicine_id']);
                    if ($medicine->quantity < $item['quantity']) {
                        throw ValidationException::withMessages([
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

                $walkinLog->update([
                    'user_id'             => $data['user_id'],
                    'visited_at'          => $data['visited_at'],
                    'chief_complaint'     => $data['chief_complaint'],
                    'vital_signs'         => $data['vital_signs']  ?? null,
                    'diagnosis'           => $data['diagnosis']    ?? null,
                    'treatment'           => $data['treatment']    ?? null,
                    'medicines_dispensed' => !empty($dispensed) ? $dispensed : null,
                    'notes'               => $data['notes']        ?? null,
                ]);
            });
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Walk-in log updated successfully.');
    }

    public function destroy(Request $request, WalkinLog $walkinLog)
    {
        abort_unless($request->user()->isSuperAdmin(), 403);
        $walkinLog->delete();
        return back()->with('success', 'Walk-in log deleted.');
    }

    /*
    |--------------------------------------------------------------------------
    | Follow-Up Calendar
    |--------------------------------------------------------------------------
    */

    public function followUpCalendar(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));
        [$year, $m] = explode('-', $month);

        $logs = WalkinLog::whereYear('follow_up_date', $year)
            ->whereMonth('follow_up_date', $m)
            ->with(['user:id,name,email,profile_photo_path', 'followUpScheduledBy:id,name'])
            ->orderBy('follow_up_date')
            ->get();

        return Inertia::render('Admin/WalkinLog/FollowUpCalendar', [
            'followupsByDate' => $logs->groupBy(fn($l) => $l->follow_up_date->toDateString()),
            'month'           => $month,
            'currentDate'     => now()->toDateString(),
            'holidays'        => array_merge(
                PhilippineHolidays::getHolidaysForYear((int) $year),
                PhilippineHolidays::getHolidaysForYear((int) $year + 1),
            ),
        ]);
    }

    public function scheduleFollowUp(Request $request, WalkinLog $walkinLog)
    {
        $data = $request->validate([
            'follow_up_date'  => ['required', 'date', 'after_or_equal:today'],
            'follow_up_time'  => ['nullable', 'date_format:H:i'],
            'follow_up_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $walkinLog->update([
            'follow_up_date'                        => $data['follow_up_date'],
            'follow_up_time'                         => $data['follow_up_time']  ?? null,
            'follow_up_notes'                        => $data['follow_up_notes'] ?? null,
            'follow_up_status'                       => 'scheduled',
            'follow_up_scheduled_by'                 => $request->user()->id,
            'follow_up_reminder_day_before_sent_at'   => null,
            'follow_up_reminder_day_of_sent_at'       => null,
        ]);

        $walkinLog->user?->notify(new WalkinFollowUpNotification($walkinLog->fresh(), 'scheduled'));

        return back()->with('success', 'Follow-up visit scheduled.');
    }

    public function updateFollowUp(Request $request, WalkinLog $walkinLog)
    {
        abort_unless($walkinLog->follow_up_date, 404);

        $data = $request->validate([
            'follow_up_date'  => ['required', 'date', 'after_or_equal:today'],
            'follow_up_time'  => ['nullable', 'date_format:H:i'],
            'follow_up_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $walkinLog->update([
            'follow_up_date'                        => $data['follow_up_date'],
            'follow_up_time'                         => $data['follow_up_time']  ?? null,
            'follow_up_notes'                        => $data['follow_up_notes'] ?? null,
            'follow_up_status'                       => 'scheduled',
            'follow_up_scheduled_by'                 => $request->user()->id,
            'follow_up_reminder_day_before_sent_at'   => null,
            'follow_up_reminder_day_of_sent_at'       => null,
        ]);

        $walkinLog->user?->notify(new WalkinFollowUpNotification($walkinLog->fresh(), 'rescheduled'));

        return back()->with('success', 'Follow-up visit rescheduled.');
    }

    public function cancelFollowUp(Request $request, WalkinLog $walkinLog)
    {
        abort_unless($walkinLog->follow_up_date, 404);

        $walkinLog->update(['follow_up_status' => 'cancelled']);

        $walkinLog->user?->notify(new WalkinFollowUpNotification($walkinLog->fresh(), 'cancelled'));

        return back()->with('success', 'Follow-up visit cancelled.');
    }

    public function completeFollowUp(Request $request, WalkinLog $walkinLog)
    {
        abort_unless($walkinLog->follow_up_date, 404);

        $walkinLog->update(['follow_up_status' => 'completed']);

        return back()->with('success', 'Follow-up marked as completed.');
    }
}