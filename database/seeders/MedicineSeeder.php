<?php
namespace Database\Seeders;
use App\Models\Medicine;
use Illuminate\Database\Seeder;

class MedicineSeeder extends Seeder
{
    public function run(): void
    {
        $medicines = [
            ['name' => 'Paracetamol 500mg',   'unit' => 'tablets', 'quantity' => 500, 'reorder_level' => 50, 'expiration_date' => '2026-12-31'],
            ['name' => 'Ibuprofen 200mg',      'unit' => 'tablets', 'quantity' => 300, 'reorder_level' => 30, 'expiration_date' => '2026-06-30'],
            ['name' => 'Amoxicillin 500mg',    'unit' => 'capsules','quantity' => 200, 'reorder_level' => 20, 'expiration_date' => '2025-12-31'],
            ['name' => 'Cetirizine 10mg',      'unit' => 'tablets', 'quantity' => 150, 'reorder_level' => 15, 'expiration_date' => '2026-09-30'],
            ['name' => 'Omeprazole 20mg',      'unit' => 'capsules','quantity' => 100, 'reorder_level' => 10, 'expiration_date' => '2026-03-31'],
            ['name' => 'Metronidazole 500mg',  'unit' => 'tablets', 'quantity' => 80,  'reorder_level' => 10, 'expiration_date' => '2026-01-31'],
            ['name' => 'Betadine Solution',    'unit' => 'ml',      'quantity' => 20,  'reorder_level' => 5,  'expiration_date' => '2025-10-31'],
            ['name' => 'Alcohol 70% Isopropyl','unit' => 'ml',      'quantity' => 10,  'reorder_level' => 5,  'expiration_date' => '2026-12-31'],
            ['name' => 'Sterile Gauze Pads',   'unit' => 'pcs',     'quantity' => 200, 'reorder_level' => 20, 'expiration_date' => null],
            ['name' => 'Oral Rehydration Salt','unit' => 'sachets', 'quantity' => 0,   'reorder_level' => 10, 'expiration_date' => '2026-06-30'],
        ];
        foreach ($medicines as $medicine) {
            Medicine::firstOrCreate(['name' => $medicine['name']], array_merge($medicine, ['is_active' => true]));
        }
    }
}
