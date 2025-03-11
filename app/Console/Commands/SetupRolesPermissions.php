<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use App\Services\RoleService;

class SetupRolesPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'setup:roles-permissions {--fresh : Run migrations fresh}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set up roles and permissions for the application';

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
        $this->info('Setting up roles and permissions...');

        // Run migrations with or without fresh based on option
        if ($this->option('fresh')) {
            $this->info('Running fresh migrations...');
            Artisan::call('migrate:fresh', ['--force' => true]);
            $this->info(Artisan::output());
        }

        // Run the RolesAndPermissionsSeeder
        $this->info('Running RolesAndPermissionsSeeder...');
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\RolesAndPermissionsSeeder',
            '--force' => true,
        ]);
        $this->info(Artisan::output());

        // Ensure the protected admin exists
        $this->info('Ensuring protected admin account exists...');
        $adminUser = $this->roleService->ensureProtectedAdminExists();
        
        if ($adminUser->wasRecentlyCreated) {
            $this->info('Created protected admin account: ' . $adminUser->email);
        } else {
            $this->info('Verified protected admin account: ' . $adminUser->email);
        }

        $this->info('Roles and permissions setup completed successfully!');
        $this->info('Protected admin account credentials:');
        $this->info('Email: admin@4gtracker.com');
        $this->info('Password: Admin4G$ecure!');
        $this->warn('IMPORTANT: This is a protected account that cannot have its super-admin role removed!');

        return Command::SUCCESS;
    }
} 