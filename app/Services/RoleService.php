<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Collection;

class RoleService
{
    /**
     * The email of the protected super admin user that should always keep super-admin role.
     */
    const PROTECTED_ADMIN_EMAIL = 'admin@4gtracker.com';
    
    /**
     * The default password for the protected admin account.
     */
    const PROTECTED_ADMIN_PASSWORD = 'Admin4G$ecure!';
    
    /**
     * Sync a user's primary role with their Spatie roles.
     * 
     * @param User $user
     * @return void
     */
    public function syncUserPrimaryRole(User $user): void
    {
        // Special handling for the protected admin account
        if ($user->email === self::PROTECTED_ADMIN_EMAIL) {
            $this->ensureSuperAdminRole($user);
            return;
        }
        
        // Regular role synchronization for other users
        // Get the user's primary role from the 'role' column
        $primaryRole = $user->role;
        
        // Get the user's roles from Spatie
        $spatieRoles = $user->roles()->pluck('name')->toArray();
        
        // If the primary role is not in the Spatie roles, add it
        if (!in_array($primaryRole, $spatieRoles) && $primaryRole) {
            $role = Role::where('name', $primaryRole)->first();
            if ($role) {
                $user->assignRole($role);
            }
        }
        
        // If the user has Spatie roles but no primary role, set the primary role
        if (empty($primaryRole) && !empty($spatieRoles)) {
            $user->role = $spatieRoles[0];
            $user->save();
        }
    }
    
    /**
     * Ensure the protected super admin account always has the super-admin role.
     * 
     * @param User $user
     * @return void
     */
    protected function ensureSuperAdminRole(User $user): void
    {
        // Get the super-admin role
        $superAdminRole = Role::where('name', 'super-admin')->first();
        
        if (!$superAdminRole) {
            // Create it if it doesn't exist
            $superAdminRole = $this->createRole('super-admin', 'Super Administrator with full access', '#DC2626');
        }
        
        // Make sure the user has the super-admin role
        if (!$user->hasRole('super-admin')) {
            $user->assignRole($superAdminRole);
        }
        
        // Make sure the primary role is set to super-admin
        if ($user->role !== 'super-admin') {
            $user->role = 'super-admin';
            $user->save();
        }
    }
    
    /**
     * Get all available roles.
     * 
     * @return Collection
     */
    public function getAllRoles(): Collection
    {
        return Role::orderBy('name')->get();
    }
    
    /**
     * Get users by role.
     * 
     * @param string $roleName
     * @return Collection
     */
    public function getUsersByRole(string $roleName): Collection
    {
        return User::whereHas('roles', function($query) use ($roleName) {
            $query->where('name', $roleName);
        })->get();
    }
    
    /**
     * Create a new role with default permissions based on the role type.
     * 
     * @param string $name
     * @param string $description
     * @param string $color
     * @return Role
     */
    public function createRole(string $name, string $description = null, string $color = '#6B7280'): Role
    {
        return Role::create([
            'name' => $name,
            'guard_name' => 'web',
            'description' => $description,
            'color' => $color,
        ]);
    }
    
    /**
     * Ensure the protected admin account exists and has super-admin role.
     * 
     * @return User
     */
    public function ensureProtectedAdminExists(): User
    {
        // Try to find the protected admin user
        $adminUser = User::where('email', self::PROTECTED_ADMIN_EMAIL)->first();
        
        if (!$adminUser) {
            // Create the admin user if it doesn't exist
            $adminUser = User::create([
                'name' => 'System Administrator',
                'email' => self::PROTECTED_ADMIN_EMAIL,
                'password' => bcrypt(self::PROTECTED_ADMIN_PASSWORD),
                'role' => 'super-admin'
            ]);
        } else {
            // Update password if it's the default one
            if ($adminUser->password === bcrypt('password')) {
                $adminUser->password = bcrypt(self::PROTECTED_ADMIN_PASSWORD);
                $adminUser->save();
            }
        }
        
        // Make sure it has the super-admin role
        $this->ensureSuperAdminRole($adminUser);
        
        return $adminUser;
    }
} 