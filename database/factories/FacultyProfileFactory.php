<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class FacultyProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'employee_id'    => strtoupper(fake()->bothify('EMP-####')),
            'department'     => fake()->randomElement([
                'College of Information Technology',
                'College of Education',
                'College of Business',
                'College of Nursing',
                'College of Criminology',
                'General Education',
                'Administration',
            ]),
            'position'       => fake()->randomElement(['Instructor I', 'Instructor II', 'Assistant Professor', 'Associate Professor', 'Professor', 'Department Head']),
            'birth_date'     => fake()->dateTimeBetween('-60 years', '-25 years')->format('Y-m-d'),
            'sex'            => fake()->randomElement(['male', 'female']),
            'contact_number' => fake()->numerify('09#########'),
            'address'        => fake()->address(),
            'civil_status'   => fake()->randomElement(['single', 'married', 'widowed', 'separated']),
            'is_pregnant'    => false,
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
