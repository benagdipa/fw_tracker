<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $roles = [
            'super-admin',
            'admin',
            'editor',
            'user'
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // Create permissions
        $permissions = [
            'view wntd',
            'create wntd',
            'edit wntd',
            'delete wntd',
            'manage users',
            'manage roles',
            'manage settings'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Assign permissions to roles
        $superAdmin = Role::findByName('super-admin', 'web');
        $admin = Role::findByName('admin', 'web');
        $editor = Role::findByName('editor', 'web');
        $user = Role::findByName('user', 'web');

        // Super admin gets everything
        $superAdmin->givePermissionTo(Permission::all());

        // Admin gets most permissions
        $admin->givePermissionTo([
            'view wntd',
            'create wntd',
            'edit wntd',
            'delete wntd',
            'manage users'
        ]);

        // Editor gets content management permissions
        $editor->givePermissionTo([
            'view wntd',
            'create wntd',
            'edit wntd'
        ]);

        // User gets basic permissions
        $user->givePermissionTo([
            'view wntd'
        ]);
    }
} 