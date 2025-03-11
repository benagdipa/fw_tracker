<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => 'user', // Add default role for all factory users
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure()
    {
        return $this->afterCreating(function ($user) {
            // Make sure the 'user' role exists before assigning
            if (!Role::where('name', 'user')->exists()) {
                Role::create(['name' => 'user', 'guard_name' => 'web']);
            }
            
            // Assign the role to the user
            $user->assignRole('user');
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
    
    /**
     * Indicate that the user should have an admin role.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
        ])->afterCreating(function ($user) {
            // Make sure the 'admin' role exists before assigning
            if (!Role::where('name', 'admin')->exists()) {
                Role::create(['name' => 'admin', 'guard_name' => 'web']);
            }
            
            // Assign the role to the user
            $user->assignRole('admin');
        });
    }
    
    /**
     * Indicate that the user should have a super-admin role.
     */
    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'super-admin',
        ])->afterCreating(function ($user) {
            // Make sure the 'super-admin' role exists before assigning
            if (!Role::where('name', 'super-admin')->exists()) {
                Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
            }
            
            // Assign the role to the user
            $user->assignRole('super-admin');
        });
    }
}
