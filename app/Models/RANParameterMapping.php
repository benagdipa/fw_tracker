<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * RAN Parameter Mapping Model
 * 
 * This model represents mappings between different vendor-specific RAN parameters.
 * It helps translate parameters between different vendors' equipment.
 */
class RANParameterMapping extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ran_parameter_mappings';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'parameter_id',
        'vendor_a',
        'vendor_b',
        'vendor_c',
        'vendor_d',
        'vendor_e',
        'parameter_group',
        'parameter_category',
        'description',
        'is_active',
        'sequence',
        'value_type',
        'notes',
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'sequence' => 'integer',
    ];
    
    /**
     * Scope a query to only include active parameter mappings.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
    
    /**
     * Scope a query to order by sequence.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sequence');
    }
    
    /**
     * Scope a query to filter by parameter group.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $group
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInGroup($query, $group)
    {
        return $query->where('parameter_group', $group);
    }
} 