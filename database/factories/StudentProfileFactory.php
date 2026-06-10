<?php
namespace Database\Factories;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id'    => strtoupper(fake()->bothify('TPC-####-???')),
            'program_id'    => Program::inRandomOrder()->first()?->id,
            'year_level'    => fake()->numberBetween(1, 4),
            'block'         => fake()->randomElement(['A', 'B', 'C', 'D']),
            'birth_date'    => fake()->dateTimeBetween('-25 years', '-17 years')->format('Y-m-d'),
            'sex'           => fake()->randomElement(['male', 'female']),
            'contact_number'=> fake()->numerify('09#########'),
            'address'       => fake()->address(),
            'guardian_name' => fake()->name(),
            'guardian_contact' => fake()->numerify('09#########'),
            'civil_status'  => 'single',
            'is_pregnant'   => false,
        ];
    }

    public function pregnant(): static
    {
        return $this->state(fn() => [
            'sex'                => 'female',
            'is_pregnant'        => true,
            'pregnancy_due_date' => fake()->dateTimeBetween('+1 month', '+9 months')->format('Y-m-d'),
        ]);
    }
}
