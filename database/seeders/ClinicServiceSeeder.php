<?php

namespace Database\Seeders;

use App\Models\ClinicService;
use Illuminate\Database\Seeder;

class ClinicServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['title' => 'General Consultation', 'description' => 'Walk-in or scheduled consultations for common illnesses, check-ups, and one-on-one clinical appointments.', 'icon' => 'stethoscope', 'tag' => 'Available', 'tag_type' => 'available', 'sort_order' => 1],
            ['title' => 'Emergency & First Aid', 'description' => 'Immediate response to campus emergencies with basic life support and emergency management procedures.', 'icon' => 'first-aid-kit', 'tag' => 'First Aid', 'tag_type' => 'urgent', 'sort_order' => 2],
            ['title' => 'Medical Records', 'description' => 'Digital submission and verification of health records, medical history, and requirement compliance tracking.', 'icon' => 'clipboard-list', 'tag' => 'Available', 'tag_type' => 'available', 'sort_order' => 3],
        ];

        foreach ($services as $s) {
            ClinicService::create($s);
        }
    }
}