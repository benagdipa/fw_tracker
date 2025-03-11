<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

/**
 * RAN Parameter Model
 * 
 * This model represents Radio Access Network (RAN) parameters used in 4G networks.
 * These parameters define various configuration aspects of the network elements.
 *
 * @property int $id
 * @property string $parameter_id Unique identifier for the parameter
 * @property string $parameter_name Human-readable name of the parameter
 * @property string $parameter_value Value of the parameter
 * @property string $description Detailed description of the parameter's purpose
 * @property string $domain Domain or context where the parameter is applicable
 * @property string $data_type Data type of the parameter (integer, string, boolean, etc.)
 * @property string $mo_reference Reference to the Managed Object
 * @property string $default_value Default value if not explicitly set
 * @property string $category Functional category of the parameter
 * @property string $technology Relevant technology (4G/LTE)
 * @property string $vendor Equipment vendor (Ericsson, Nokia, etc.)
 * @property string $applicability Where the parameter can be applied
 * @property string $status Current status of the parameter
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class RANParameter extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ran_parameters';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'type',
        'model',
        'mo_class_name',
        'parameter_name',
        'parameter_id',
        'parameter_value',
        'parameter_description',
        'description',
        'seq',
        'data_type',
        'range',
        'def',
        'mul',
        'unit',
        'rest',
        'read',
        'restr',
        'manc',
        'pers',
        'syst',
        'change',
        'dist',
        'dependencies',
        'dep',
        'obs',
        'prec',
        'domain',
        'mo_reference',
        'default_value',
        'category',
        'technology',
        'vendor',
        'applicability',
        'status'
    ];
    
    protected $casts = [
        'mul' => 'boolean',
        'seq' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    protected $attributes = [
        'status' => 'active',
        'type' => 'parameter'
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->status) {
                $model->status = 'active';
            }
        });

        static::saving(function ($model) {
            // Convert empty strings to null
            foreach ($model->attributes as $key => $value) {
                if ($value === '') {
                    $model->attributes[$key] = null;
                }
            }

            // Ensure seq is an integer if provided
            if (isset($model->attributes['seq']) && !is_null($model->attributes['seq'])) {
                $model->attributes['seq'] = (int)$model->attributes['seq'];
            }

            // Ensure mul is boolean
            if (isset($model->attributes['mul'])) {
                $model->attributes['mul'] = (bool)$model->attributes['mul'];
            }
        });
    }

    /**
     * Get parameters filtered by technology
     *
     * @param string $technology
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getByTechnology($technology)
    {
        return self::where('technology', $technology)->get();
    }
    
    /**
     * Get parameters filtered by vendor
     *
     * @param string $vendor
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getByVendor($vendor)
    {
        return self::where('vendor', $vendor)->get();
    }

    // Scope for struct parameters
    public function scopeStructParameters($query)
    {
        return $query->where('type', 'struct');
    }

    // Scope for regular parameters
    public function scopeRegularParameters($query)
    {
        return $query->where('type', 'parameter');
    }

    // Scope for active parameters
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get the parameter's history records
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function history()
    {
        return $this->hasMany(RANParameterHistory::class, 'parameter_id');
    }

    /**
     * Get the parameter's structure
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function structure()
    {
        return $this->belongsTo(RANStructParameter::class, 'struct_parameter_id');
    }

    public function trackChanges($changes = [])
    {
        if (empty($changes)) {
            $changes = $this->getDirty();
        }

        if (!empty($changes)) {
            $history = new RANParameterHistory([
                'parameter_id' => $this->id,
                'user_id' => Auth::id(),
                'changes' => json_encode($changes),
                'action' => 'update'
            ]);
            $history->save();
        }
    }

    public function trackCreation()
    {
        $history = new RANParameterHistory([
            'parameter_id' => $this->id,
            'user_id' => Auth::id(),
            'changes' => json_encode($this->attributes),
            'action' => 'create'
        ]);
        $history->save();
    }

    public function scopeByTechnology($query, $technology)
    {
        return $query->where('technology', $technology);
    }

    public function scopeByVendor($query, $vendor)
    {
        return $query->where('vendor', $vendor);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }
} 