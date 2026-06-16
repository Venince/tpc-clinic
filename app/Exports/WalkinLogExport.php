<?php

namespace App\Exports;

use App\Models\WalkinLog;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class WalkinLogExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(private array $filters = []) {}

    public function collection(): Collection
    {
        return WalkinLog::with(['user', 'loggedBy'])
            ->when(isset($this->filters['date_from']), fn($q) => $q->whereDate('visited_at', '>=', $this->filters['date_from']))
            ->when(isset($this->filters['date_to']),   fn($q) => $q->whereDate('visited_at', '<=', $this->filters['date_to']))
            ->when(isset($this->filters['logged_by']), fn($q) => $q->where('logged_by', $this->filters['logged_by']))
            ->latest('visited_at')
            ->get();
    }

    public function headings(): array
    {
        return [
            '#',
            'Patient Name',
            'Email',
            'Date & Time',
            'Chief Complaint',
            'BP',
            'Temp (°C)',
            'HR (bpm)',
            'RR (rpm)',
            'O2 Sat (%)',
            'Weight (kg)',
            'Height (cm)',
            'Diagnosis',
            'Treatment',
            'Medicines Dispensed',
            'Notes',
            'Logged By',
        ];
    }

    public function map($log): array
    {
        static $i = 0;
        $i++;

        $vs = $log->vital_signs ?? [];
        $meds = collect($log->medicines_dispensed ?? [])
            ->map(fn($m) => ($m['name'] ?? '—') . ' x' . ($m['quantity'] ?? 1))
            ->implode(', ');

        return [
            $i,
            $log->user?->name ?? '—',
            $log->user?->email ?? '—',
            $log->visited_at?->format('Y-m-d H:i') ?? '—',
            $log->chief_complaint ?? '—',
            $vs['blood_pressure']    ?? '—',
            $vs['temperature']       ?? '—',
            $vs['heart_rate']        ?? '—',
            $vs['respiratory_rate']  ?? '—',
            $vs['oxygen_saturation'] ?? '—',
            $vs['weight']            ?? '—',
            $vs['height']            ?? '—',
            $log->diagnosis          ?? '—',
            $log->treatment          ?? '—',
            $meds ?: '—',
            $log->notes              ?? '—',
            $log->loggedBy?->name    ?? '—',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill'      => ['fillType' => 'solid', 'startColor' => ['rgb' => '16a34a']],
                'alignment' => ['horizontal' => 'center'],
            ],
        ];
    }
}