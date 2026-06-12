<?php
namespace App\Exports;
use App\Models\Medicine;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Illuminate\Support\Collection;

class MedicineInventoryExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    public function __construct(private array $filters = []) {}

    public function collection(): Collection
    {
        return Medicine::withCount('requests')
            ->when(isset($this->filters['low_stock']), fn($q) => $q->whereRaw('quantity <= reorder_level'))
            ->get();
    }

    public function headings(): array
    {
        return ['#', 'Name', 'Description', 'Unit', 'Quantity', 'Reorder Level', 'Batch #', 'Expiration Date', 'Status', 'Total Requests'];
    }

    public function map($med): array
    {
        static $i = 0; $i++;
        $status = $med->is_out_of_stock ? 'Out of Stock' : ($med->is_low_stock ? 'Low Stock' : 'OK');
        return [
            $i,
            $med->name,
            $med->description ?? '—',
            $med->unit,
            $med->quantity,
            $med->reorder_level,
            $med->batch_number ?? '—',
            $med->expiration_date?->format('Y-m-d') ?? '—',
            $status,
            $med->requests_count,
        ];
    }
}