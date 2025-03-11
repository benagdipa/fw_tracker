<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Services\TrinoServices;
use App\Services\RoleService;
use App\Models\User;
use App\Observers\UserObserver;
use Illuminate\Support\Collection;
use App\Models\RANParameter;
use App\Observers\RANParameterObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TrinoServices::class, function ($app) {
            return new TrinoServices();
        });
        
        $this->app->singleton(RoleService::class, function ($app) {
            return new RoleService();
        });
        
        // Register a collection to track user IDs being updated
        // This helps prevent infinite loops when syncing roles
        $this->app->singleton('updating_user_roles', function () {
            return new Collection();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register the user observer to sync roles
        User::observe(UserObserver::class);
        
        Gate::before(function ($user, $ability) {
            return $user->hasRole('super-admin') ? true : null;
        });

        RANParameter::observe(RANParameterObserver::class);
    }
}
