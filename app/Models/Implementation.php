<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class Implementation extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'implementations';

    protected $fillable = [
        'siteName',
        'site_name',
        'category',
        'eNB_gNB',
        'implementor',
        'comments',
        'enm_scripts_path',
        'sp_scripts_path',
        'CRQ',
        'cell_name',
        'address',
        'lat',
        'lng'
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    protected $appends = [
        'status',
        'start_date',
        'end_date',
        'progress',
        'notes'
    ];

    public function tracking()
    {
        return $this->hasMany(ImplementationTracking::class, 'implementation_area_id');
    }

    public function getStatusAttribute()
    {
        return $this->tracking()
            ->where('key', 'status')
            ->latest()
            ->value('value') ?? 'not_started';
    }

    public function getStartDateAttribute()
    {
        return $this->tracking()
            ->where('key', 'start_date')
            ->latest()
            ->value('value');
    }

    public function getEndDateAttribute()
    {
        return $this->tracking()
            ->where('key', 'end_date')
            ->latest()
            ->value('value');
    }

    public function getProgressAttribute()
    {
        return (int) ($this->tracking()
            ->where('key', 'progress')
            ->latest()
            ->value('value') ?? 0);
    }

    public function getNotesAttribute()
    {
        return $this->tracking()
            ->where('key', 'notes')
            ->latest()
            ->value('value');
    }

    protected static function booted()
    {
        static::creating(function ($implementation) {
            // Ensure siteName is set from site_name if not provided
            if (!$implementation->siteName && $implementation->site_name) {
                $implementation->siteName = $implementation->site_name;
            }
        });

        static::created(function ($implementation) {
            // Create initial tracking records
            $userId = Auth::id() ?? 1;
            
            ImplementationTracking::create([
                'implementation_area_id' => $implementation->id,
                'user_id' => $userId,
                'key' => 'status',
                'value' => 'not_started'
            ]);

            ImplementationTracking::create([
                'implementation_area_id' => $implementation->id,
                'user_id' => $userId,
                'key' => 'progress',
                'value' => '0'
            ]);
        });
    }
}
