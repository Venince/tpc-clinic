<?php
namespace Database\Factories;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AppointmentSlotFactory extends Factory
{
    public function definition(): array
    {
        $startHour = fake()->numberBetween(8, 15);
        return [
            'created_by'       => User::factory()->admin(),
            'date'             => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'start_time'       => sprintf('%02d:00', $startHour),
            'end_time'         => sprintf('%02d:00', $startHour + 1),
            'max_appointments' => fake()->numberBetween(1, 5),
            'booked_count'     => 0,
            'is_available'     => true,
        ];
    }
}
