<?php
namespace App\Exports;
use App\Models\StudentProfile;
use App\Models\FacultyProfile;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

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

class PregnantStudentsSheet implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\ShouldAutoSize
{
    public function title(): string { return 'Pregnant Students'; }
    public function collection() { return StudentProfile::where('is_pregnant', true)->with(['user', 'program'])->get(); }
    public function headings(): array { return ['#', 'Name', 'Email', 'Program', 'Year', 'Contact', 'Due Date']; }
}

class PregnantFacultySheet implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\ShouldAutoSize
{
    public function title(): string { return 'Pregnant Faculty'; }
    public function collection() { return FacultyProfile::where('is_pregnant', true)->with('user')->get(); }
    public function headings(): array { return ['#', 'Name', 'Email', 'Department', 'Position', 'Contact', 'Due Date']; }
}
