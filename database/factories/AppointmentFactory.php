<?php
namespace Database\Factories;
use App\Models\AppointmentSlot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AppointmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'             => User::factory(),
            'appointment_slot_id' => AppointmentSlot::factory(),
            'purpose'             => fake()->randomElement(['General Check-up', 'Fever', 'Headache', 'Wound Dressing', 'Certificate Request']),
            'notes'               => fake()->optional()->sentence(),
            'status'              => fake()->randomElement(['pending', 'approved', 'declined', 'completed']),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn() => ['status' => 'pending']);
    }

    public function approved(): static
    {
        return $this->state(fn() => ['status' => 'approved']);
    }
}
