<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Program;
use App\Models\RequirementType;
use App\Models\SurveyQuestion;
use App\Models\Medicine;
use App\Models\Announcement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Roles
        $roles = [
            ['name' => 'student',       'display_name' => 'Student'],
            ['name' => 'faculty_staff', 'display_name' => 'Faculty / Staff'],
            ['name' => 'admin',         'display_name' => 'Admin'],
            ['name' => 'super_admin',   'display_name' => 'Super Admin'],
        ];
        foreach ($roles as $r) Role::firstOrCreate(['name' => $r['name']], $r);

        // Default accounts
        $accounts = [
            ['name' => 'Super Admin',  'email' => 'superadmin@tpc.edu.ph', 'role' => 'super_admin', 'password' => 'SuperAdmin@123'],
            ['name' => 'Clinic Admin', 'email' => 'admin@tpc.edu.ph',      'role' => 'admin',        'password' => 'Admin@123'],
            ['name' => 'Juan dela Cruz','email'=> 'student@tpc.edu.ph',    'role' => 'student',      'password' => 'Student@123'],
            ['name' => 'Maria Santos', 'email' => 'faculty@tpc.edu.ph',    'role' => 'faculty_staff','password' => 'Faculty@123'],
        ];
        foreach ($accounts as $a) {
            $role = Role::where('name', $a['role'])->first();
            User::firstOrCreate(['email' => $a['email']], [
                'name'                  => $a['name'],
                'role_id'               => $role->id,
                'password'              => Hash::make($a['password']),
                'force_password_change' => false,
                'is_active'             => true,
                'email_verified_at'     => now(),
            ]);
        }

        // Programs
        $programs = [
            ['code' => 'BSIT',   'name' => 'Bachelor of Science in Information Technology'],
            ['code' => 'BSED',   'name' => 'Bachelor of Secondary Education'],
            ['code' => 'BEED',   'name' => 'Bachelor of Elementary Education'],
            ['code' => 'BSBA',   'name' => 'Bachelor of Science in Business Administration'],
            ['code' => 'BSHM',   'name' => 'Bachelor of Science in Hospitality Management'],
            ['code' => 'BSCRIM', 'name' => 'Bachelor of Science in Criminology'],
            ['code' => 'BSN',    'name' => 'Bachelor of Science in Nursing'],
            ['code' => 'BSCS',   'name' => 'Bachelor of Science in Computer Science'],
        ];
        foreach ($programs as $p) Program::firstOrCreate(['code' => $p['code']], array_merge($p, ['is_active' => true]));

        // Requirement types
        $reqTypes = [
            ['name' => 'Drug Test Certificate', 'description' => 'Official drug test result from an accredited lab.', 'sort_order' => 1],
            ['name' => 'Medical Certificate',   'description' => 'Certificate from a licensed physician.',           'sort_order' => 2],
            ['name' => 'Vaccination Card',      'description' => 'Updated immunization record.',                     'sort_order' => 3],
        ];
        foreach ($reqTypes as $t) RequirementType::firstOrCreate(['name' => $t['name']], array_merge($t, ['is_active' => true]));

        // Survey questions
        $questions = [
            ['question' => 'Do you have any known allergies?',          'type' => 'radio',     'options' => ['Yes','No'],                                                    'is_required' => true,  'sort_order' => 1],
            ['question' => 'If yes, please describe your allergies.',   'type' => 'paragraph', 'options' => null,                                                            'is_required' => false, 'sort_order' => 2],
            ['question' => 'Do you have any chronic conditions?',       'type' => 'checkbox',  'options' => ['Diabetes','Hypertension','Asthma','Heart Disease','None'],       'is_required' => true,  'sort_order' => 3],
            ['question' => 'Are you currently taking any medications?', 'type' => 'radio',     'options' => ['Yes','No'],                                                    'is_required' => true,  'sort_order' => 4],
            ['question' => 'List medications if applicable.',           'type' => 'paragraph', 'options' => null,                                                            'is_required' => false, 'sort_order' => 5],
            ['question' => 'How would you rate your overall health?',   'type' => 'dropdown',  'options' => ['Excellent','Good','Fair','Poor'],                               'is_required' => true,  'sort_order' => 6],
            ['question' => 'Date of last physical examination',         'type' => 'date',      'options' => null,                                                            'is_required' => false, 'sort_order' => 7],
            ['question' => 'Do you smoke or use tobacco products?',     'type' => 'radio',     'options' => ['Yes','No','Former smoker'],                                    'is_required' => true,  'sort_order' => 8],
        ];
        foreach ($questions as $q) SurveyQuestion::firstOrCreate(['question' => $q['question']], array_merge($q, ['is_active' => true]));

        // Sample medicines
        $medicines = [
            ['name' => 'Paracetamol 500mg',    'unit' => 'tablets', 'quantity' => 500, 'reorder_level' => 50, 'expiration_date' => '2026-12-31'],
            ['name' => 'Ibuprofen 200mg',       'unit' => 'tablets', 'quantity' => 300, 'reorder_level' => 30, 'expiration_date' => '2026-06-30'],
            ['name' => 'Cetirizine 10mg',       'unit' => 'tablets', 'quantity' => 150, 'reorder_level' => 15, 'expiration_date' => '2026-09-30'],
            ['name' => 'Amoxicillin 500mg',     'unit' => 'capsules','quantity' => 200, 'reorder_level' => 20, 'expiration_date' => '2025-12-31'],
            ['name' => 'Omeprazole 20mg',       'unit' => 'capsules','quantity' => 80,  'reorder_level' => 10, 'expiration_date' => '2026-03-31'],
            ['name' => 'Betadine Solution',     'unit' => 'ml',      'quantity' => 20,  'reorder_level' => 5,  'expiration_date' => '2025-10-31'],
            ['name' => 'Alcohol 70% Isopropyl', 'unit' => 'ml',      'quantity' => 10,  'reorder_level' => 5,  'expiration_date' => '2026-12-31'],
            ['name' => 'Oral Rehydration Salt', 'unit' => 'sachets', 'quantity' => 0,   'reorder_level' => 10, 'expiration_date' => '2026-06-30'],
        ];
        foreach ($medicines as $m) Medicine::firstOrCreate(['name' => $m['name']], array_merge($m, ['is_active' => true]));

        // Sample announcement
        $admin = User::where('email', 'admin@tpc.edu.ph')->first();
        Announcement::firstOrCreate(['title' => 'Welcome to TPC Clinic!'], [
            'created_by'   => $admin->id,
            'content'      => 'Welcome to the Talibon Polytechnic College Clinic Management System. You can book appointments, request medicine, submit health surveys, and upload medical requirements through this portal.',
            'category'     => 'general',
            'is_published' => true,
            'published_at' => now(),
        ]);
    }
}
