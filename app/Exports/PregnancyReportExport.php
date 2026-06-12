<?php
namespace App\Exports;
use App\Models\StudentProfile;
use App\Models\FacultyProfile;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Illuminate\Support\Collection;

class PregnancyReportExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            'Students'      => new PregnantStudentsSheet(),
            'Faculty/Staff' => new PregnantFacultySheet(),
        ];
    }
}

class PregnantStudentsSheet implements
    \Maatwebsite\Excel\Concerns\FromCollection,
    \Maatwebsite\Excel\Concerns\WithHeadings,
    \Maatwebsite\Excel\Concerns\WithMapping,
    \Maatwebsite\Excel\Concerns\WithTitle,
    \Maatwebsite\Excel\Concerns\ShouldAutoSize
{
    public function title(): string { return 'Pregnant Students'; }

    public function collection(): Collection
    {
        return StudentProfile::where('is_pregnant', true)->with(['user', 'program'])->get();
    }

    public function headings(): array
    {
        return ['#', 'Name', 'Email', 'Program', 'Year', 'Block', 'Birth Date', 'Contact', 'Address', 'Guardian', 'Guardian Contact', 'Due Date', 'Medical Notes'];
    }

    public function map($p): array
    {
        static $i = 0; $i++;
        return [
            $i,
            $p->user->name,
            $p->user->email,
            $p->program?->code ?? '—',
            $p->year_level ?? '—',
            $p->block ?? '—',
            $p->birth_date?->format('Y-m-d') ?? '—',
            $p->contact_number ?? '—',
            $p->address ?? '—',
            $p->guardian_name ?? '—',
            $p->guardian_contact ?? '—',
            $p->pregnancy_due_date?->format('Y-m-d') ?? '—',
            $p->medical_notes ?? '—',
        ];
    }
}

class PregnantFacultySheet implements
    \Maatwebsite\Excel\Concerns\FromCollection,
    \Maatwebsite\Excel\Concerns\WithHeadings,
    \Maatwebsite\Excel\Concerns\WithMapping,
    \Maatwebsite\Excel\Concerns\WithTitle,
    \Maatwebsite\Excel\Concerns\ShouldAutoSize
{
    public function title(): string { return 'Pregnant Faculty'; }

    public function collection(): Collection
    {
        return FacultyProfile::where('is_pregnant', true)->with('user')->get();
    }

    public function headings(): array
    {
        return ['#', 'Name', 'Email', 'Department', 'Position', 'Birth Date', 'Contact', 'Address', 'Due Date', 'Medical Notes'];
    }

    public function map($p): array
    {
        static $i = 0; $i++;
        return [
            $i,
            $p->user->name,
            $p->user->email,
            $p->department ?? '—',
            $p->position ?? '—',
            $p->birth_date?->format('Y-m-d') ?? '—',
            $p->contact_number ?? '—',
            $p->address ?? '—',
            $p->pregnancy_due_date?->format('Y-m-d') ?? '—',
            $p->medical_notes ?? '—',
        ];
    }
}