<?php
namespace App\Exports;
use App\Models\SurveyQuestion;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Illuminate\Support\Collection;

class SurveyReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    public function collection(): Collection
    {
        return SurveyQuestion::withCount('answers')->orderBy('sort_order')->get();
    }

    public function headings(): array
    {
        return ['#', 'Question', 'Type', 'Options', 'Required', 'Active', 'Total Responses'];
    }

    public function map($q): array
    {
        static $i = 0; $i++;
        return [
            $i,
            $q->question,
            ucfirst($q->type),
            $q->options ? implode(', ', $q->options) : '—',
            $q->is_required ? 'Yes' : 'No',
            $q->is_active ? 'Yes' : 'No',
            $q->answers_count,
        ];
    }
}