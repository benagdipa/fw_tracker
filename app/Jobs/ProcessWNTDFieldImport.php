<?php

namespace App\Jobs;

use App\Models\Location;
use App\Models\LocationTracking;
use App\Models\WNTD;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessWNTDFieldImport implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $mappings;
    protected $data;

    /**
     * Create a new job instance.
     */
    public function __construct($mappings, $data)
    {
        $this->mappings = $mappings;
        $this->data = $data;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Track stats for reporting
        $created = 0;
        $updated = 0;
        $errors = 0;
        
        // Check if we're using PostgreSQL for database-specific optimizations
        $isPostgres = DB::connection()->getDriverName() === 'pgsql';

        foreach ($this->data as $row) {
            try {
                // Use database transaction to ensure data integrity
                DB::beginTransaction();

                // Extract field values using mappings
                $fieldValues = $this->extractFieldValues($row);

                // Skip if we don't have the required fields
                if (empty($fieldValues['site_name']) || empty($fieldValues['wntd'])) {
                    Log::warning('Skipping row without required fields', $fieldValues);
                    continue;
                }

                // Check if record already exists - Use PostgreSQL-compatible queries
                $query = WNTD::query();
                
                if ($isPostgres) {
                    // For PostgreSQL, we need to use case-insensitive comparison for better matches
                    $query->where(function($q) use ($fieldValues) {
                        $q->whereRaw('LOWER(wntd) = LOWER(?)', [$fieldValues['wntd']])
                          ->orWhere(function($sq) use ($fieldValues) {
                              if (!empty($fieldValues['site_name']) && !empty($fieldValues['loc_id'])) {
                                  $sq->whereRaw('LOWER(site_name) = LOWER(?)', [$fieldValues['site_name']])
                                     ->whereRaw('LOWER(loc_id) = LOWER(?)', [$fieldValues['loc_id'] ?? '']);
                              }
                          });
                    });
                } else {
                    // For MySQL and other databases
                    $query->where('wntd', $fieldValues['wntd'])
                          ->orWhere(function($q) use ($fieldValues) {
                              if (!empty($fieldValues['site_name']) && !empty($fieldValues['loc_id'])) {
                                  $q->where('site_name', $fieldValues['site_name'])
                                    ->where('loc_id', $fieldValues['loc_id'] ?? '');
                              }
                          });
                }
                
                $existingRecord = $query->first();

                if ($existingRecord) {
                    // Update existing record
                    $existingRecord->update($fieldValues);
                    $updated++;
                } else {
                    // Create new record
                    $wntd = WNTD::create($fieldValues);
                    $created++;
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("Error processing WNTD import row: " . $e->getMessage(), [
                    'row' => $row,
                    'exception' => $e
                ]);
                $errors++;
            }
        }

        // Log stats for reporting
        Log::info("WNTD import completed", [
            'created' => $created,
            'updated' => $updated,
            'errors' => $errors,
            'total' => count($this->data),
            'database' => $isPostgres ? 'PostgreSQL' : 'Other'
        ]);
    }

    /**
     * Extract values from a CSV row using mappings
     */
    private function extractFieldValues($row)
    {
        $values = [];
        
        foreach ($this->mappings as $csvColumn => $dbField) {
            if (empty($dbField)) continue; // Skip ignored columns
            
            $values[$dbField] = $row[$csvColumn] ?? null;
        }
        
        return $values;
    }

    /**
     * Build location data array from extracted values
     */
    private function buildLocationData($fieldValues)
    {
        // Define which fields belong in the locations table
        $locationFields = [
            'site_name', 'loc_id', 'wntd', 'imsi', 'version', 'avc', 
            'bw_profile', 'lat', 'lng', 'home_cell', 'home_pci', 'traffic_profile'
        ];
        
        $locationData = [];
        
        foreach ($locationFields as $field) {
            if (isset($fieldValues[$field])) {
                $locationData[$field] = $fieldValues[$field];
            }
        }
        
        return $locationData;
    }

    /**
     * Store tracking data for a location
     */
    private function storeTrackingData($locationId, $fieldValues)
    {
        // Define which fields go into the tracking table
        $trackingFields = [
            'start_date', 'end_date', 'solution_type', 'status', 'remarks'
        ];
        
        foreach ($trackingFields as $field) {
            if (isset($fieldValues[$field]) && !empty($fieldValues[$field])) {
                // Create a tracking record for each field
                LocationTracking::create([
                    'site_id' => $locationId,
                    'loc_id' => $fieldValues['loc_id'] ?? '',
                    'user_id' => auth()->id() ?? 1,
                    'key' => $field,
                    'value' => $fieldValues[$field],
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }
} 