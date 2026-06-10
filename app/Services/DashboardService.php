<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\FacultyProfile;
use App\Models\Medicine;
use App\Models\MedicineRequest;
use App\Models\Program;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getAdminStats(): array
    {
        return [
            'users' => [
                'total_students'       => User::whereHas('role', fn($q) => $q->where('name', 'student'))->count(),
                'total_faculty'        => User::whereHas('role', fn($q) => $q->where('name', 'faculty_staff'))->count(),
                'total_programs'       => Program::where('is_active', true)->count(),
            ],
            'appointments' => [
                'total'     => Appointment::count(),
                'pending'   => Appointment::where('status', 'pending')->count(),
                'approved'  => Appointment::where('status', 'approved')->count(),
                'today'     => Appointment::whereHas('slot', fn($q) => $q->whereDate('date', today()))->count(),
            ],
            'medicine' => [
                'total_medicines'    => Medicine::where('is_active', true)->count(),
                'pending_requests'   => MedicineRequest::where('status', 'pending')->count(),
                'low_stock'          => Medicine::where('is_active', true)->where('quantity', '>', 0)->whereRaw('quantity <= reorder_level')->count(),
                'out_of_stock'       => Medicine::where('is_active', true)->where('quantity', 0)->count(),
            ],
            'pregnancy' => [
                'pregnant_students' => StudentProfile::where('is_pregnant', true)->count(),
                'pregnant_faculty'  => FacultyProfile::where('is_pregnant', true)->count(),
            ],
        ];
    }

    public function getAppointmentChartData(int $months = 6): array
    {
        $data = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $date  = now()->subMonths($i);
            $label = $date->format('M Y');

            $data[] = [
                'label'     => $label,
                'pending'   => Appointment::whereHas('slot', fn($q) => $q->whereYear('date', $date->year)->whereMonth('date', $date->month))->where('status', 'pending')->count(),
                'approved'  => Appointment::whereHas('slot', fn($q) => $q->whereYear('date', $date->year)->whereMonth('date', $date->month))->where('status', 'approved')->count(),
                'declined'  => Appointment::whereHas('slot', fn($q) => $q->whereYear('date', $date->year)->whereMonth('date', $date->month))->where('status', 'declined')->count(),
            ];
        }
        return $data;
    }

    public function getMedicineChartData(): array
    {
        return Medicine::where('is_active', true)
            ->select('name', 'quantity', 'reorder_level')
            ->orderBy('quantity')
            ->limit(10)
            ->get()
            ->map(fn($m) => [
                'name'          => $m->name,
                'quantity'      => $m->quantity,
                'reorder_level' => $m->reorder_level,
                'status'        => $m->is_out_of_stock ? 'out_of_stock' : ($m->is_low_stock ? 'low_stock' : 'ok'),
            ])
            ->toArray();
    }

    public function getProgramDistribution(): array
    {
        return StudentProfile::select('program_id', DB::raw('count(*) as total'))
            ->with('program:id,name,code')
            ->groupBy('program_id')
            ->get()
            ->map(fn($s) => [
                'program' => $s->program?->name ?? 'Unassigned',
                'code'    => $s->program?->code ?? 'N/A',
                'total'   => $s->total,
            ])
            ->toArray();
    }

    public function getPregnancyStats(): array
    {
        return [
            'students' => StudentProfile::where('is_pregnant', true)
                ->with('user:id,name,email', 'program:id,name,code')
                ->get(),
            'faculty' => FacultyProfile::where('is_pregnant', true)
                ->with('user:id,name,email')
                ->get(),
        ];
    }
}
