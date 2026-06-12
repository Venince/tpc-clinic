<?php
namespace App\Exports;
use App\Models\Appointment;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Illuminate\Support\Collection;

class AppointmentExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    public function __construct(private array $filters = []) {}

    public function collection(): Collection
    {
        return Appointment::with(['user', 'slot', 'reviewer'])
            ->when(isset($this->filters['status']),    fn($q) => $q->where('status', $this->filters['status']))
            ->when(isset($this->filters['date_from']), fn($q) => $q->whereHas('slot', fn($s) => $s->whereDate('date', '>=', $this->filters['date_from'])))
            ->when(isset($this->filters['date_to']),   fn($q) => $q->whereHas('slot', fn($s) => $s->whereDate('date', '<=', $this->filters['date_to'])))
            ->latest()->get();
    }

    public function headings(): array
    {
        return ['#', 'Patient Name', 'Email', 'Purpose', 'Notes', 'Date', 'Time', 'Status', 'Reviewed By', 'Reviewed At', 'Decline Reason'];
    }

    public function map($appt): array
    {
        static $i = 0; $i++;
        return [
            $i,
            $appt->user->name,
            $appt->user->email,
            $appt->purpose,
            $appt->notes ?? '—',
            $appt->slot->date->format('Y-m-d'),
            $appt->slot->start_time,
            ucfirst($appt->status),
            $appt->reviewer?->name ?? '—',
            $appt->reviewed_at?->format('Y-m-d H:i') ?? '—',
            $appt->decline_reason ?? '—',
        ];
    }
}