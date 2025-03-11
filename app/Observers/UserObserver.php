<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Role;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // Check if this is the protected admin account
        if ($user->email === 'admin@4gtracker.com') {
            $this->ensureSuperAdminRole($user);
        } else {
            $this->syncRoles($user);
        }
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        // Check if this is the protected admin account
        if ($user->email === 'admin@4gtracker.com') {
            $this->ensureSuperAdminRole($user);
        } else {
            $this->syncRoles($user);
        }
    }

    /**
     * Handle the User "saved" event.
     */
    public function saved(User $user): void
    {
        // Check if this is the protected admin account
        if ($user->email === 'admin@4gtracker.com') {
            $this->ensureSuperAdminRole($user);
        } else {
            $this->syncRoles($user);
        }
    }

    /**
     * Ensure the protected admin account always has the super-admin role.
     */
    protected function ensureSuperAdminRole(User $user): void
    {
        // Only proceed if we're not already processing this user (prevents infinite loop)
        if (!app('updating_user_roles')->contains($user->id)) {
            app('updating_user_roles')->push($user->id);
            
            // Make sure the role column is set to super-admin
            if ($user->role !== 'super-admin') {
                $user->role = 'super-admin';
                $user->saveQuietly();
            }
            
            // Make sure the user has the super-admin role in Spatie
            if (!$user->hasRole('super-admin')) {
                $role = Role::where('name', 'super-admin')->first();
                if ($role) {
                    $user->assignRole($role);
                }
            }
            
            app('updating_user_roles')->forget(app('updating_user_roles')->search($user->id));
        }
    }

    /**
     * Sync roles with the role column.
     * This is used to keep the role column in sync with the Spatie roles.
     */
    protected function syncRoles(User $user): void
    {
        // If the 'role' column was updated, make sure it matches a role in Spatie
        if ($user->isDirty('role') || $user->wasChanged('role')) {
            $roleName = $user->role;
            
            // Only proceed if we're not already processing this user (prevents infinite loop)
            if (!app('updating_user_roles')->contains($user->id)) {
                app('updating_user_roles')->push($user->id);
                
                // Make sure the user has this role in Spatie system
                if (!$user->hasRole($roleName)) {
                    // Get the actual Spatie role
                    $role = Role::where('name', $roleName)->first();
                    
                    if ($role) {
                        // Assign the role using Spatie
                        $user->assignRole($role);
                    }
                }
                
                app('updating_user_roles')->forget(app('updating_user_roles')->search($user->id));
            }
        }
    }
} 