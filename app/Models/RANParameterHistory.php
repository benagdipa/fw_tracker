<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RANParameterHistory extends Model
{
    use HasFactory;

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
        'changed_by',
        'change_reason'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
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
        return $this->belongsTo(User::class, 'changed_by');
    }
} 