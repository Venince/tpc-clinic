<?php
namespace Database\Seeders;
use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    public function run(): void
    {
        $programs = [
            ['code' => 'BSIT',   'name' => 'Bachelor of Science in Information Technology'],
            ['code' => 'BSED',   'name' => 'Bachelor of Secondary Education'],
            ['code' => 'BEED',   'name' => 'Bachelor of Elementary Education'],
            ['code' => 'BSBA',   'name' => 'Bachelor of Science in Business Administration'],
            ['code' => 'BSHM',   'name' => 'Bachelor of Science in Hospitality Management'],
            ['code' => 'BSN',    'name' => 'Bachelor of Science in Nursing'],
            ['code' => 'BSCRIM', 'name' => 'Bachelor of Science in Criminology'],
            ['code' => 'BSCS',   'name' => 'Bachelor of Science in Computer Science'],
        ];
        foreach ($programs as $program) {
            Program::firstOrCreate(['code' => $program['code']], array_merge($program, ['is_active' => true]));
        }
    }
}
