<?php
namespace Database\Seeders;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::where('name', 'super_admin')->first();
        $adminRole      = Role::where('name', 'admin')->first();
        $studentRole    = Role::where('name', 'student')->first();
        $facultyRole    = Role::where('name', 'faculty_staff')->first();

        User::firstOrCreate(['email' => 'superadmin@tpc.edu.ph'], [
            'name'                  => 'Super Admin',
            'role_id'               => $superAdminRole->id,
            'password'              => Hash::make('SuperAdmin@123'),
            'force_password_change' => false,
            'is_active'             => true,
            'email_verified_at'     => now(),
        ]);

        User::firstOrCreate(['email' => 'admin@tpc.edu.ph'], [
            'name'                  => 'Clinic Admin',
            'role_id'               => $adminRole->id,
            'password'              => Hash::make('Admin@123'),
            'force_password_change' => false,
            'is_active'             => true,
            'email_verified_at'     => now(),
        ]);

        // Sample student
        $student = User::firstOrCreate(['email' => 'student@tpc.edu.ph'], [
            'name'                  => 'Juan dela Cruz',
            'role_id'               => $studentRole->id,
            'password'              => Hash::make('Student@123'),
            'force_password_change' => false,
            'is_active'             => true,
            'email_verified_at'     => now(),
        ]);

        // Sample faculty
        $faculty = User::firstOrCreate(['email' => 'faculty@tpc.edu.ph'], [
            'name'                  => 'Maria Santos',
            'role_id'               => $facultyRole->id,
            'password'              => Hash::make('Faculty@123'),
            'force_password_change' => false,
            'is_active'             => true,
            'email_verified_at'     => now(),
        ]);
    }
}
