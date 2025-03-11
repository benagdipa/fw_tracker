<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RoleService;

class EnsureProtectedAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:ensure-protected {--force : Force create/update without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ensure the protected admin@4gtracker.com account exists with super-admin role';

    /**
     * The role service instance.
     *
     * @var \App\Services\RoleService
     */
    protected $roleService;

    /**
     * Create a new command instance.
     */
    public function __construct(RoleService $roleService)
    {
        parent::__construct();
        $this->roleService = $roleService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('force') && !$this->confirm('This will ensure the protected admin account exists with super-admin role. Proceed?')) {
            $this->info('Operation cancelled.');
            return Command::SUCCESS;
        }

        $this->info('Ensuring protected admin account...');
        
        $adminUser = $this->roleService->ensureProtectedAdminExists();
        
        $this->info('Success! The protected admin account details:');
        $this->table(
            ['Name', 'Email', 'Role'],
            [
                [$adminUser->name, $adminUser->email, $adminUser->role]
            ]
        );
        
        if ($adminUser->wasRecentlyCreated) {
            $this->warn('A new admin account was created with the default password. Please change it immediately!');
        } else {
            $this->info('The existing admin account was verified and has super-admin role.');
        }

        return Command::SUCCESS;
    }
} 