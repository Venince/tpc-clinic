<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedicineFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'            => fake()->unique()->words(3, true) . ' ' . fake()->numberBetween(100, 1000) . 'mg',
            'description'     => fake()->sentence(),
            'unit'            => fake()->randomElement(['tablets', 'capsules', 'ml', 'pcs', 'sachets']),
            'quantity'        => fake()->numberBetween(0, 500),
            'reorder_level'   => fake()->numberBetween(5, 30),
            'expiration_date' => fake()->dateTimeBetween('+1 month', '+3 years')->format('Y-m-d'),
            'is_active'       => true,
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn() => ['quantity' => 0]);
    }

    public function lowStock(): static
    {
        return $this->state(fn() => ['quantity' => 5, 'reorder_level' => 10]);
    }
}
