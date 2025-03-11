<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Permission\Models\Role;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'profile_photo',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Bootstrap the model and its traits.
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();

        // When roles are synced, update the primary role column
        static::saved(function ($user) {
            // Only update if the roles have been loaded
            if ($user->relationLoaded('roles')) {
                $primaryRole = $user->roles->first();
                if ($primaryRole && $user->role !== $primaryRole->name) {
                    $user->role = $primaryRole->name;
                    $user->saveQuietly(); // Save without triggering additional events
                }
            }
        });
    }

    /**
     * Check if user has the given role (case-insensitive).
     *
     * @param string|array $roles
     * @return bool
     */
    public function hasAnyRoleName($roles): bool
    {
        if (!is_array($roles)) {
            $roles = [$roles];
        }

        return $this->roles->pluck('name')->map(function($role) {
            return strtolower($role);
        })->intersect(array_map('strtolower', $roles))->isNotEmpty();
    }

    /**
     * Get user's primary role (the one stored in the role column).
     *
     * @return string|null
     */
    public function getPrimaryRole(): ?string
    {
        return $this->role;
    }

    /**
     * Get all roles assigned to the user.
     *
     * @return array
     */
    public function getAllRoles(): array
    {
        return $this->roles()->pluck('name')->toArray();
    }

    public function sites()
    {
        return $this->hasMany(Site::class);
    }
    
    public function tracking()
    {
        return $this->hasMany(LocationTracking::class);
    }

    public function wntd()
    {
        return $this->hasMany(WNTD::class);
    }
}
