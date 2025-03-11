<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RANParameterHistory extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ran_parameter_history';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'parameter_id',
        'field_name',
        'old_value',
        'new_value',
        'user_id',
        'change_type',
        'changes',
        'action'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'changes' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];
    
    /**
     * The attributes that should have default values.
     *
     * @var array
     */
    protected $attributes = [
        'field_name' => 'parameter_value',
        'change_type' => 'create'
    ];

    protected function asJson($value)
    {
        return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    protected function setNewValueAttribute($value)
    {
        $this->attributes['new_value'] = is_null($value) ? null : (string) $value;
    }

    protected function setOldValueAttribute($value)
    {
        $this->attributes['old_value'] = is_null($value) ? null : (string) $value;
    }

    /**
     * Boot the model.
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            // Set field_name default if it's not already set
            if (empty($model->field_name)) {
                $model->field_name = 'parameter_value';
            }
            
            // Set change_type default if it's not already set
            if (empty($model->change_type)) {
                $model->change_type = 'create';
            }
        });
    }

    /**
     * Get the parameter that owns this history record
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function parameter()
    {
        return $this->belongsTo(RANParameter::class, 'parameter_id');
    }

    /**
     * Get the user who made the change
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
} 