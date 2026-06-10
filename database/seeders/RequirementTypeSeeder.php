<?php
namespace Database\Seeders;
use App\Models\RequirementType;
use Illuminate\Database\Seeder;

class RequirementTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Drug Test Certificate',  'description' => 'Official drug test certificate from an accredited laboratory.',  'sort_order' => 1],
            ['name' => 'Medical Certificate',    'description' => 'Medical certificate from a licensed physician.',                  'sort_order' => 2],
            ['name' => 'Vaccination Card',       'description' => 'Updated vaccination record / immunization card.',                'sort_order' => 3],
        ];
        foreach ($types as $type) {
            RequirementType::firstOrCreate(['name' => $type['name']], array_merge($type, ['is_active' => true]));
        }
    }
}
