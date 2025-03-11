<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;

class CreateAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create or reset the hardcoded admin account with super-admin privileges';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Creating/Resetting hardcoded admin account...');

        // Hardcoded credentials (these should match the seeder)
        $email = 'admin@4gtracker.com';
        $password = 'Admin4G$ecure!';
        $name = 'System Administrator';
        
        // Create super-admin role if it doesn't exist
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);

        // Check if the hardcoded admin exists
        $adminExists = User::where('email', $email)->exists();
        
        if ($adminExists) {
            $this->info('Admin account already exists. Resetting password and ensuring super-admin role...');
            
            // Force update the existing admin to ensure credentials are correct
            DB::table('users')
                ->where('email', $email)
                ->update([
                    'name' => $name,
                    'password' => Hash::make($password),
                    'email_verified_at' => now(),
                    'updated_at' => now(),
                ]);
                
            $admin = User::where('email', $email)->first();
        } else {
            $this->info('Creating new admin account...');
            
            // Create the hardcoded admin
            $admin = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);
        }

        // Assign super-admin role
        if (!$admin->hasRole('super-admin')) {
            $admin->assignRole($superAdminRole);
            $this->info('Assigned super-admin role to account.');
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
            
            $this->info('Added role mapping in database.');
        }

        $this->info('Hardcoded admin account is now ready to use.');
        $this->info('Email: ' . $email);
        $this->info('Password: ' . $password);
        $this->warn('Keep these credentials secure and use only when necessary.');
        
        return Command::SUCCESS;
    }
} 