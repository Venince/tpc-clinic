<?php

namespace App\Exports;

use App\Models\FacultyProfile;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Illuminate\Support\Collection;

class FacultyHealthExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    public function __construct(private array $filters = []) {}

    public function collection(): Collection
    {
        return FacultyProfile::with('user')
            ->when(isset($this->filters['department']),  fn($q) => $q->where('department', $this->filters['department']))
            ->when(isset($this->filters['is_pregnant']), fn($q) => $q->where('is_pregnant', $this->filters['is_pregnant']))
            ->get();
    }

    public function headings(): array
    {
        return [
            '#', 'Employee ID', 'Full Name', 'Email', 'Department', 'Position',
            'Sex', 'Birth Date', 'Civil Status', 'Contact', 'Address',
            'Pregnant', 'Due Date', 'Medical Notes', 'Account Status', 'Last Login',
        ];
    }

    public function map($profile): array
    {
        static $i = 0;
        $i++;
        return [
            $i,
            $profile->employee_id,
            $profile->user->name,
            $profile->user->email,
            $profile->department ?? '—',
            $profile->position ?? '—',
            ucfirst($profile->sex ?? '—'),
            $profile->birth_date?->format('Y-m-d') ?? '—',
            ucfirst($profile->civil_status ?? '—'),
            $profile->contact_number ?? '—',
            $profile->address ?? '—',
            $profile->is_pregnant ? 'Yes' : 'No',
            $profile->pregnancy_due_date?->format('Y-m-d') ?? '—',
            $profile->medical_notes ?? '—',
            $profile->user->is_active ? 'Active' : 'Inactive',
            $profile->user->last_login_at?->format('Y-m-d H:i') ?? 'Never',
        ];
    }
}