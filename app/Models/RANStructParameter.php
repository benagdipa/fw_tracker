<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RANStructParameter extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ran_struct_parameters';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'model',
        'mo_class_name',
        'parameter_name',
        'seq',
        'parameter_description',
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
        'prec'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'mul' => 'boolean',
        'seq' => 'integer'
    ];
}