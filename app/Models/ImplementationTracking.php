<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImplementationTracking extends Model
{
    use HasFactory;
    protected $table = 'implementations_trackings';
    protected $fillable = ["implementation_area_id", "user_id", "key", "value"];

    public function user()
    {
        return $this->belongsTo(User::class, "user_id");
    }
}
