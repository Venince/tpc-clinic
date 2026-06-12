<?php

namespace App\Exports;

use App\Models\StudentProfile;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Illuminate\Support\Collection;

class StudentHealthExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    public function __construct(private array $filters = []) {}

    public function collection(): Collection
    {
        return StudentProfile::with(['user', 'program'])
            ->when(isset($this->filters['program_id']), fn($q) => $q->where('program_id', $this->filters['program_id']))
            ->when(isset($this->filters['year_level']),  fn($q) => $q->where('year_level', $this->filters['year_level']))
            ->when(isset($this->filters['is_pregnant']), fn($q) => $q->where('is_pregnant', $this->filters['is_pregnant']))
            ->get();
    }

    public function headings(): array
    {
        return [
            '#', 'Student ID', 'Full Name', 'Email', 'Program', 'Year', 'Block',
            'Sex', 'Birth Date', 'Civil Status', 'Contact', 'Address',
            'Guardian Name', 'Guardian Contact', 'Pregnant', 'Due Date', 'Medical Notes',
            'Account Status', 'Last Login',
        ];
    }

    public function map($profile): array
    {
        static $i = 0;
        $i++;
        return [
            $i,
            $profile->student_id,
            $profile->user->name,
            $profile->user->email,
            $profile->program?->code ?? '—',
            $profile->year_level ?? '—',
            $profile->block ?? '—',
            ucfirst($profile->sex ?? '—'),
            $profile->birth_date?->format('Y-m-d') ?? '—',
            ucfirst($profile->civil_status ?? '—'),
            $profile->contact_number ?? '—',
            $profile->address ?? '—',
            $profile->guardian_name ?? '—',
            $profile->guardian_contact ?? '—',
            $profile->is_pregnant ? 'Yes' : 'No',
            $profile->pregnancy_due_date?->format('Y-m-d') ?? '—',
            $profile->medical_notes ?? '—',
            $profile->user->is_active ? 'Active' : 'Inactive',
            $profile->user->last_login_at?->format('Y-m-d H:i') ?? 'Never',
        ];
    }
}