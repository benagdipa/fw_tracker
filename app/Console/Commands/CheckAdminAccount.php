<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RoleService;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CheckAdminAccount extends Command
{
    protected $signature = 'admin:check-credentials';
    protected $description = 'Check and fix admin account credentials if needed';

    protected $roleService;

    public function __construct(RoleService $roleService)
    {
        parent::__construct();
        $this->roleService = $roleService;
    }

    public function handle()
    {
        $this->info('Checking admin account credentials...');

        // Find the admin user
        $adminUser = User::where('email', RoleService::PROTECTED_ADMIN_EMAIL)->first();

        if (!$adminUser) {
            $this->error('Admin account not found! Creating it now...');
            $adminUser = $this->roleService->ensureProtectedAdminExists();
            $this->info('Admin account created successfully.');
        } else {
            $this->info('Admin account found.');
        }

        // Verify password
        if (!Hash::check(RoleService::PROTECTED_ADMIN_PASSWORD, $adminUser->password)) {
            $this->warn('Password mismatch detected. Updating password...');
            $adminUser->password = Hash::make(RoleService::PROTECTED_ADMIN_PASSWORD);
            $adminUser->save();
            $this->info('Password updated successfully.');
        } else {
            $this->info('Password is correct.');
        }

        // Verify super-admin role
        if (!$adminUser->hasRole('super-admin')) {
            $this->warn('Super-admin role missing. Adding it now...');
            $this->roleService->ensureSuperAdminRole($adminUser);
            $this->info('Super-admin role added successfully.');
        } else {
            $this->info('Super-admin role is correctly assigned.');
        }

        $this->info("\nAdmin account details:");
        $this->info('Email: ' . $adminUser->email);
        $this->info('Password: ' . RoleService::PROTECTED_ADMIN_PASSWORD);
        $this->info('Role: ' . $adminUser->role);
        $this->info('Created at: ' . $adminUser->created_at);
        $this->info('Last updated: ' . $adminUser->updated_at);

        return Command::SUCCESS;
    }
} 