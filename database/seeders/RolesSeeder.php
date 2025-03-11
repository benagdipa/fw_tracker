<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;

/**
 * @deprecated Use RolesAndPermissionsSeeder instead
 * This seeder is kept for backward compatibility but should not be used directly.
 */
class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */ 
    
     public function run(): void
     {
         // Warn about deprecation
         $this->command->warn('RolesSeeder is deprecated. Use RolesAndPermissionsSeeder instead.');
         
         // Check if RolesAndPermissionsSeeder has already run
         if (Role::where('name', 'super-admin')->exists() &&
             Role::where('name', 'user')->exists() &&
             Role::where('name', 'editor')->exists()) {
             $this->command->info('Roles already set up. Skipping RolesSeeder.');
             return;
         }
         
         // Ensure super-admin role exists
         $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);
 
         // Rename guest role to user if it exists (lowercase for consistency)
         $guestRole = Role::where('name', 'guest')->first();
         if ($guestRole) {
             // Check if 'user' role already exists
             $userRole = Role::where('name', 'user')->first();
             if (!$userRole) {
                 $guestRole->name = 'user';
                 $guestRole->save();
             } else {
                 // If 'user' role exists, delete the guest role
                 $guestRole->delete();
             }
         } else {
             // Create user role if guest role does not exist
             Role::firstOrCreate(['name' => 'user']);
         }
 
         // Create editor role if it does not exist
         Role::firstOrCreate(['name' => 'editor']);
     }
}
