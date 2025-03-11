<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Implementation extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'implementations';

    protected $fillable = [
        'site_name',
        'cell_name',
        'category',
        'implementor',
        'status',
        'notes',
        'enm_scripts_path',
        'sp_scripts_path',
        'CRQ',
        'start_date',
        'end_date',
        'address',
        'lat',
        'lng'
    ];

    public function tracking()
    {
        return $this->hasMany(ImplementationTracking::class, 'implementation_area_id');
    }
}
