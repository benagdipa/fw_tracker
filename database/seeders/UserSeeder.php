<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use App\Services\RoleService;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a super admin user if it doesn't exist
        $superAdmin = User::firstOrCreate(
            ['email' => RoleService::PROTECTED_ADMIN_EMAIL],
            [
                'name' => 'System Administrator',
                'password' => Hash::make(RoleService::PROTECTED_ADMIN_PASSWORD),
                'role' => 'super-admin',
            ]
        );

        // Assign super-admin role using Spatie's method
        $superAdminRole = Role::findByName('super-admin');
        $superAdmin->assignRole($superAdminRole);

        // Create a test user if it doesn't exist
        $testUser = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'role' => 'user',
            ]
        );

        // Assign user role using Spatie's method
        $userRole = Role::findByName('user');
        $testUser->assignRole($userRole);
    }
}
