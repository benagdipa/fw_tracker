<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'site_name',
        'site_description',
        'maintenance_mode',
        'email_notifications',
        'api_rate_limit',
        'backup_frequency',
    ];

    protected $casts = [
        'maintenance_mode' => 'boolean',
        'email_notifications' => 'boolean',
        'api_rate_limit' => 'integer',
    ];
} 