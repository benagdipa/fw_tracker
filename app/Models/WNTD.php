<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WNTD extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'wntd';

    protected $fillable = [
        'site_name',
        'loc_id',
        'wntd',
        'imsi',
        'version',
        'avc',
        'bw_profile',
        'lon',
        'lat',
        'home_cell',
        'home_pci',
        'remarks',
        'start_date',
        'end_date',
        'solution_type',
        'status',
        'artefacts'
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
        'lon' => 'float',
        'lat' => 'float',
        'start_date' => 'date',
        'end_date' => 'date',
        'artefacts' => 'array'
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        // Track changes when a model is updated
        static::updating(function ($wntd) {
            $wntd->trackChanges();
        });

        // Track creation
        static::created(function ($wntd) {
            $wntd->trackCreation();
        });

        // Track deletion
        static::deleted(function ($wntd) {
            $wntd->trackDeletion();
        });
    }

    /**
     * Track changes to the model
     */
    protected function trackChanges()
    {
        try {
            DB::beginTransaction();
            
            $original = $this->getOriginal();
            $changes = [];

            foreach ($this->getDirty() as $key => $value) {
                // Skip timestamps
                if (in_array($key, ['updated_at', 'created_at'])) {
                    continue;
                }

                $changes[] = [
                    'wntd_id' => $this->id,
                    'field_name' => $key,
                    'old_value' => $original[$key] ?? null,
                    'new_value' => $value,
                    'user_id' => Auth::id(),
                    'change_type' => 'update',
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }

            if (count($changes) > 0) {
                DB::table('wntd_history')->insert($changes);
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error tracking WNTD changes: ' . $e->getMessage());
        }
    }

    /**
     * Track creation of new WNTD record
     */
    protected function trackCreation()
    {
        try {
            DB::beginTransaction();
            
            $changes = [];
            foreach ($this->getAttributes() as $key => $value) {
                if (!in_array($key, ['updated_at', 'created_at'])) {
                    $changes[] = [
                        'wntd_id' => $this->id,
                        'field_name' => $key,
                        'old_value' => null,
                        'new_value' => $value,
                        'user_id' => Auth::id(),
                        'change_type' => 'create',
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                }
            }
            
            if (count($changes) > 0) {
                DB::table('wntd_history')->insert($changes);
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error tracking WNTD creation: ' . $e->getMessage());
        }
    }

    /**
     * Track deletion of WNTD record
     */
    protected function trackDeletion()
    {
        try {
            DB::beginTransaction();
            
            $changes = [];
            foreach ($this->getAttributes() as $key => $value) {
                if (!in_array($key, ['updated_at', 'created_at'])) {
                    $changes[] = [
                        'wntd_id' => $this->id,
                        'field_name' => $key,
                        'old_value' => $value,
                        'new_value' => null,
                        'user_id' => Auth::id(),
                        'change_type' => 'delete',
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                }
            }
            
            if (count($changes) > 0) {
                DB::table('wntd_history')->insert($changes);
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error tracking WNTD deletion: ' . $e->getMessage());
        }
    }
    
    /**
     * Get the history of changes for this WNTD record
     */
    public function getHistory()
    {
        return DB::table('wntd_history')
            ->where('wntd_id', $this->id)
            ->orderBy('created_at', 'desc')
            ->paginate(50);
    }

    /**
     * Scope a query to only include WNTD records matching a search term
     */
    public function scopeSearch($query, $term)
    {
        if ($term) {
            return $query->where(function ($query) use ($term) {
                // Use case-insensitive search
                $operator = \DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';
                $searchTerm = \DB::connection()->getDriverName() === 'pgsql' ? "%{$term}%" : "%{$term}%";
                
                $query->whereRaw("site_name {$operator} ?", [$searchTerm])
                    ->orWhereRaw("loc_id {$operator} ?", [$searchTerm])
                    ->orWhereRaw("wntd {$operator} ?", [$searchTerm])
                    ->orWhereRaw("imsi {$operator} ?", [$searchTerm])
                    ->orWhereRaw("status {$operator} ?", [$searchTerm]);
            });
        }
        
        return $query;
    }
    
    /**
     * Apply filtering based on a status value
     */
    public function scopeFilterByStatus($query, $status)
    {
        if ($status) {
            return $query->where('status', $status);
        }
        
        return $query;
    }
    
    /**
     * Apply date range filtering for start_date and/or end_date
     */
    public function scopeFilterByDateRange($query, $startDate = null, $endDate = null, $field = 'start_date')
    {
        if ($startDate) {
            $query->whereDate($field, '>=', $startDate);
        }
        
        if ($endDate) {
            $query->whereDate($field, '<=', $endDate);
        }
        
        return $query;
    }
} 