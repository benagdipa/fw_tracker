<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;

/**
 * @deprecated Use RolesAndPermissionsSeeder instead
 * This seeder is kept for backward compatibility but should not be used directly.
 */
class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Warn about deprecation
        $this->command->warn('SuperAdminSeeder is deprecated. Use RolesAndPermissionsSeeder instead.');
        
        // Only proceed if the admin from RolesAndPermissionsSeeder doesn't exist
        if (User::where('email', 'admin@example.com')->exists()) {
            $this->command->info('Admin user already exists. Skipping SuperAdminSeeder.');
            return;
        }
        
        // Hardcoded credentials (don't change these)
        $email = 'admin@4gtracker.com';
        $password = 'Admin4G$ecure!';
        $name = 'System Administrator';
        
        // Create super-admin role if it doesn't exist
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);

        // Check if the hardcoded admin exists
        $adminExists = User::where('email', $email)->exists();
        
        if ($adminExists) {
            // Force update the existing admin to ensure credentials are correct
            DB::table('users')
                ->where('email', $email)
                ->update([
                    'name' => $name,
                    'password' => Hash::make($password),
                    'email_verified_at' => now(),
                    'updated_at' => now(),
                    'role' => 'super-admin', // Ensure the role field is consistent
                ]);
                
            $admin = User::where('email', $email)->first();
        } else {
            // Create the hardcoded admin
            $admin = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'role' => 'super-admin', // Ensure the role field is consistent
            ]);
        }

        // Assign super-admin role
        if (!$admin->hasRole('super-admin')) {
            $admin->assignRole($superAdminRole);
        }

        // Make entry in model_has_roles table if not exists
        if (DB::table('model_has_roles')
            ->where('model_id', $admin->id)
            ->where('role_id', $superAdminRole->id)
            ->doesntExist()) {
            
            DB::table('model_has_roles')->insert([
                'role_id' => $superAdminRole->id,
                'model_type' => 'App\\Models\\User',
                'model_id' => $admin->id,
            ]);
        }

        $this->command->info('Super admin account has been created/updated.');
        $this->command->info('Email: ' . $email);
        $this->command->info('Password: ' . $password);
        $this->command->warn('Keep these credentials secure and use only when necessary.');
    }
} 