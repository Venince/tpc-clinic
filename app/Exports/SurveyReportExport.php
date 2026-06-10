<?php
namespace App\Exports;
use App\Models\SurveyQuestion;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class SurveyReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    public function collection()
    {
        return SurveyQuestion::withCount('answers')->orderBy('sort_order')->get();
    }

    public function headings(): array
    {
        return ['#', 'Question', 'Type', 'Required', 'Total Responses'];
    }

    public function map($q): array
    {
        static $i = 0; $i++;
        return [$i, $q->question, ucfirst($q->type), $q->is_required ? 'Yes' : 'No', $q->answers_count];
    }
}
