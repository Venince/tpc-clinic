<?php

namespace App\Exports;

use App\Models\FacultyProfile;
use App\Models\StudentProfile;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class HeadcountExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithTitle
{
    private string $category;

    public function __construct(private array $filters = [])
    {
        $this->category = $filters['category'] ?? 'student';
    }

    public function collection(): Collection
    {
        if ($this->category === 'faculty') {
            return FacultyProfile::selectRaw("COALESCE(department, 'Unspecified') as department, COUNT(*) as total")
                ->groupBy('department')
                ->orderBy('department')
                ->get();
        }

        return StudentProfile::with('program:id,code,name')
            ->when(isset($this->filters['program_id']), fn($q) => $q->where('program_id', $this->filters['program_id']))
            ->selectRaw('program_id, year_level, block, COUNT(*) as total')
            ->groupBy('program_id', 'year_level', 'block')
            ->orderBy('program_id')->orderBy('year_level')->orderBy('block')
            ->get();
    }

    public function headings(): array
    {
        return $this->category === 'faculty'
            ? ['#', 'Department', 'Total']
            : ['#', 'Program', 'Year Level', 'Block', 'Total'];
    }

    public function map($row): array
    {
        static $i = 0;
        $i++;

        if ($this->category === 'faculty') {
            return [$i, $row->department, $row->total];
        }

        return [
            $i,
            $row->program?->code ?? '—',
            $row->year_level ?? '—',
            $row->block ?? '—',
            $row->total,
        ];
    }

    public function title(): string
    {
        return $this->category === 'faculty' ? 'Faculty & Staff Headcount' : 'Student Headcount';
    }
}