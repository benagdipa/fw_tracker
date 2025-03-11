<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\RoleService;

class SyncUserRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:sync-roles {--force : Run without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize user role column with Spatie roles';

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
        if (!$this->option('force') && !$this->confirm('This will synchronize all user roles. Do you want to continue?')) {
            $this->info('Operation cancelled.');
            return Command::SUCCESS;
        }

        $this->info('Starting user role synchronization...');
        $this->newLine();

        $users = User::with('roles')->get();
        $bar = $this->output->createProgressBar(count($users));
        $bar->start();

        $synced = 0;
        $unchanged = 0;

        foreach ($users as $user) {
            $originalRole = $user->role;
            $originalSpatieRoles = $user->roles()->pluck('name')->toArray();
            
            $this->roleService->syncUserPrimaryRole($user);
            
            // Refresh user data
            $user->refresh();
            $newRole = $user->role;
            $newSpatieRoles = $user->roles()->pluck('name')->toArray();
            
            if ($originalRole !== $newRole || count(array_diff($originalSpatieRoles, $newSpatieRoles)) > 0 || count(array_diff($newSpatieRoles, $originalSpatieRoles)) > 0) {
                $synced++;
            } else {
                $unchanged++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Role synchronization completed:");
        $this->table(
            ['Status', 'Count'],
            [
                ['Synchronized', $synced],
                ['Unchanged', $unchanged],
                ['Total Users', $users->count()]
            ]
        );

        return Command::SUCCESS;
    }
} 