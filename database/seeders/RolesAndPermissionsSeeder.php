<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User management
            'view users',
            'create users',
            'edit users',
            'delete users',
            
            // Role management
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
            
            // Permission management
            'view permissions',
            'assign permissions',
            
            // Access control
            'manage access',
            
            // General permissions
            'view dashboard',
            'edit settings',
            'view reports',
            'export data',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles with descriptions and colors
        $roles = [
            // All role names are lowercase for consistency
            'super-admin' => [
                'permissions' => $permissions,
                'description' => 'Full access to all system features and settings',
                'color' => '#EF4444' // red
            ],
            'admin' => [
                'permissions' => [
                    'view users', 'create users', 'edit users',
                    'view roles',
                    'view permissions',
                    'view dashboard', 'edit settings', 'view reports', 'export data',
                ],
                'description' => 'Administrative access with some restrictions',
                'color' => '#3B82F6' // blue
            ],
            'editor' => [
                'permissions' => [
                    'view dashboard', 'edit settings', 'view reports', 'export data',
                ],
                'description' => 'Can edit content but cannot manage users',
                'color' => '#10B981' // green
            ],
            'user' => [  // Changed from 'User' to 'user' for consistency
                'permissions' => [
                    'view dashboard', 
                    'view reports',
                    'export data',
                    'view users',
                ],
                'description' => 'Basic user with access to view everything except admin panels',
                'color' => '#6B7280' // gray
            ],
        ];

        foreach ($roles as $roleName => $roleData) {
            // Check if role exists, create or update
            $role = Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web'],
                [
                    'description' => $roleData['description'],
                    'color' => $roleData['color']
                ]
            );
            
            // Update description and color if the role already exists
            if ($role->wasRecentlyCreated === false) {
                $role->description = $roleData['description'];
                $role->color = $roleData['color'];
                $role->save();
            }
            
            // Sync permissions to ensure role has correct permissions
            $role->syncPermissions($roleData['permissions']);
        }

        // Create a default super-admin user if none exists
        if (User::where('email', 'admin@example.com')->doesntExist()) {
            $admin = User::create([
                'name' => 'Super Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),  // Change this in production!
                'role' => 'super-admin',  // Ensure this matches the role name exactly
            ]);
            
            $admin->assignRole('super-admin');
        }
    }
} 