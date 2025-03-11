<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateSuperAdmin extends Command
{
    protected $signature = 'create:super-admin';
    protected $description = 'Create or update super admin user';

    public function handle()
    {
        $email = 'admin@4gtracker.com';
        $password = 'admin123'; // You can change this password

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = new User();
            $user->email = $email;
            $user->name = 'Super Admin';
            $user->role = 'super-admin';
            $user->password = Hash::make($password);
            $user->save();
            $this->info('Super admin user created successfully!');
        } else {
            $user->password = Hash::make($password);
            $user->role = 'super-admin';
            $user->save();
            $this->info('Super admin user updated successfully!');
        }

        $this->info('Email: ' . $email);
        $this->info('Password: ' . $password);
    }
} 