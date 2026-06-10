<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\FacultyProfile;
use App\Models\Medicine;
use App\Models\MedicineRequest;
use App\Models\Program;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_students' => User::whereHas('role', fn($q) => $q->where('name', 'student'))->count(),
            'total_faculty'  => User::whereHas('role', fn($q) => $q->where('name', 'faculty_staff'))->count(),
            'total_programs' => Program::where('is_active', true)->count(),
            'appointments'   => [
                'total'     => Appointment::count(),
                'pending'   => Appointment::where('status', 'pending')->count(),
                'today'     => Appointment::whereHas('slot', fn($q) => $q->whereDate('date', today()))->count(),
            ],
            'medicine' => [
                'total'          => Medicine::where('is_active', true)->count(),
                'pending_reqs'   => MedicineRequest::where('status', 'pending')->count(),
                'low_stock'      => Medicine::where('is_active', true)->where('quantity', '>', 0)->whereRaw('quantity <= reorder_level')->count(),
                'out_of_stock'   => Medicine::where('is_active', true)->where('quantity', 0)->count(),
            ],
            'pregnancy' => [
                'students' => StudentProfile::where('is_pregnant', true)->count(),
                'faculty'  => FacultyProfile::where('is_pregnant', true)->count(),
                'student_list' => StudentProfile::where('is_pregnant', true)
                    ->with(['user:id,name,email', 'program:id,code'])
                    ->get()
                    ->map(fn($s) => [
                        'name'     => $s->user?->name,
                        'email'    => $s->user?->email,
                        'program'  => $s->program?->code ?? '—',
                        'due_date' => $s->pregnancy_due_date?->format('M d, Y'),
                    ]),
                'faculty_list' => FacultyProfile::where('is_pregnant', true)
                    ->with('user:id,name,email')
                    ->get()
                    ->map(fn($f) => [
                        'name'     => $f->user?->name,
                        'email'    => $f->user?->email,
                        'due_date' => $f->pregnancy_due_date?->format('M d, Y'),
                    ]),
            ],
        ];

        // Appointment trend (last 6 months)
        $appointmentTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $appointmentTrend[] = [
                'month'     => $date->format('M Y'),
                'pending'   => Appointment::whereHas('slot', fn($q) => $q->whereYear('date', $date->year)->whereMonth('date', $date->month))->where('status', 'pending')->count(),
                'approved'  => Appointment::whereHas('slot', fn($q) => $q->whereYear('date', $date->year)->whereMonth('date', $date->month))->where('status', 'approved')->count(),
                'declined'  => Appointment::whereHas('slot', fn($q) => $q->whereYear('date', $date->year)->whereMonth('date', $date->month))->where('status', 'declined')->count(),
            ];
        }

        // Medicine stock overview
        $medicineStock = Medicine::where('is_active', true)
            ->select('name', 'quantity', 'reorder_level')
            ->orderBy('quantity')
            ->limit(8)
            ->get()
            ->map(fn($m) => [
                'name'     => $m->name,
                'quantity' => $m->quantity,
                'reorder'  => $m->reorder_level,
                'status' => $m->is_out_of_stock ? 'out' : ($m->is_low_stock ? 'low' : 'ok'),
            ]);

        // Program distribution
        $programDist = StudentProfile::select('program_id', DB::raw('count(*) as total'))
            ->with('program:id,name,code')
            ->groupBy('program_id')
            ->get()
            ->map(fn($s) => ['program' => $s->program?->code ?? 'N/A', 'total' => $s->total]);

        // Recent appointments
        $recentAppointments = Appointment::with(['user:id,name', 'slot'])
            ->latest()->limit(5)->get()
            ->map(fn($a) => [
                'id'      => $a->id,
                'patient' => $a->user->name,
                'purpose' => $a->purpose,
                'date'    => $a->slot->date->format('M d, Y'),
                'time'    => $a->slot->start_time,
                'status'  => $a->status,
            ]);

        return Inertia::render('Admin/Dashboard/Index', compact(
            'stats', 'appointmentTrend', 'medicineStock', 'programDist', 'recentAppointments'
        ));
    }
}
