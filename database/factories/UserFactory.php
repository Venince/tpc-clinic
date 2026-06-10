<?php
namespace Database\Factories;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'role_id'               => Role::where('name','student')->first()?->id ?? 1,
            'name'                  => fake()->name(),
            'email'                 => fake()->unique()->safeEmail(),
            'password'              => Hash::make('Password@123'),
            'force_password_change' => false,
            'is_active'             => true,
            'email_verified_at'     => now(),
            'remember_token'        => Str::random(10),
        ];
    }
    public function admin(): static { return $this->state(fn()=>['role_id'=>Role::where('name','admin')->first()?->id]); }
    public function student(): static { return $this->state(fn()=>['role_id'=>Role::where('name','student')->first()?->id]); }
    public function faculty(): static { return $this->state(fn()=>['role_id'=>Role::where('name','faculty_staff')->first()?->id]); }
    public function forcePasswordChange(): static { return $this->state(fn()=>['force_password_change'=>true]); }
    public function inactive(): static { return $this->state(fn()=>['is_active'=>false]); }
}
