<?php
namespace Database\Seeders;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'student',       'display_name' => 'Student'],
            ['name' => 'faculty_staff', 'display_name' => 'Faculty/Staff'],
            ['name' => 'admin',         'display_name' => 'Admin'],
            ['name' => 'super_admin',   'display_name' => 'Super Admin'],
        ];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }

        $permissions = [
            // Users
            ['name' => 'users.view',   'display_name' => 'View Users',   'group' => 'users'],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'group' => 'users'],
            ['name' => 'users.edit',   'display_name' => 'Edit Users',   'group' => 'users'],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'group' => 'users'],
            // Appointments
            ['name' => 'appointments.manage', 'display_name' => 'Manage Appointments', 'group' => 'appointments'],
            ['name' => 'appointments.book',   'display_name' => 'Book Appointments',   'group' => 'appointments'],
            // Medicines
            ['name' => 'medicines.manage', 'display_name' => 'Manage Medicines', 'group' => 'medicines'],
            ['name' => 'medicines.request','display_name' => 'Request Medicines','group' => 'medicines'],
            // Reports
            ['name' => 'reports.generate', 'display_name' => 'Generate Reports', 'group' => 'reports'],
            // Survey
            ['name' => 'survey.manage', 'display_name' => 'Manage Survey', 'group' => 'survey'],
            ['name' => 'survey.answer', 'display_name' => 'Answer Survey', 'group' => 'survey'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm['name']], $perm);
        }

        // Assign permissions to roles
        $adminPermissions = Permission::whereIn('name', [
            'users.view','users.create','users.edit','users.delete',
            'appointments.manage','medicines.manage','reports.generate','survey.manage',
        ])->get();

        $studentPermissions = Permission::whereIn('name', [
            'appointments.book','medicines.request','survey.answer',
        ])->get();

        Role::where('name', 'admin')->first()?->permissions()->sync($adminPermissions->pluck('id'));
        Role::where('name', 'super_admin')->first()?->permissions()->sync(Permission::all()->pluck('id'));
        Role::where('name', 'student')->first()?->permissions()->sync($studentPermissions->pluck('id'));
        Role::where('name', 'faculty_staff')->first()?->permissions()->sync($studentPermissions->pluck('id'));
    }
}
