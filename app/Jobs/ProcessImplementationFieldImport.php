<?php

namespace App\Jobs;

use App\Models\Implementation;
use App\Models\ImplementationTracking;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessImplementationFieldImport implements ShouldQueue
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

        foreach ($this->data as $row) {
            try {
                // Use database transaction to ensure data integrity
                DB::beginTransaction();

                // Extract field values using mappings
                $fieldValues = $this->extractFieldValues($row);

                // Skip if we don't have the required fields
                if (empty($fieldValues['siteName'])) {
                    Log::warning('Skipping row without required fields', $fieldValues);
                    continue;
                }

                // Check if record already exists (by site name and category if available)
                $query = Implementation::where('siteName', $fieldValues['siteName']);
                if (!empty($fieldValues['category'])) {
                    $query->where('category', $fieldValues['category']);
                }
                $existingRecord = $query->first();

                if ($existingRecord) {
                    // Update existing record
                    $existingRecord->update($this->buildImplementationData($fieldValues));
                    $this->storeTrackingData($existingRecord->id, $fieldValues);
                    $updated++;
                } else {
                    // Create new record
                    $implementation = Implementation::create($this->buildImplementationData($fieldValues));
                    $this->storeTrackingData($implementation->id, $fieldValues);
                    $created++;
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("Error processing Implementation import row: " . $e->getMessage(), [
                    'row' => $row,
                    'exception' => $e
                ]);
                $errors++;
            }
        }

        // Log stats for reporting
        Log::info("Implementation import completed", [
            'created' => $created,
            'updated' => $updated,
            'errors' => $errors,
            'total' => count($this->data)
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
     * Build implementation data array from extracted values
     */
    private function buildImplementationData($fieldValues)
    {
        // Define which fields belong in the implementations table
        $implementationFields = [
            'siteName', 'category', 'eNB_gNB', 'implementor', 'status', 
            'comments', 'enm_scripts_path', 'sp_scripts_path', 'CRQ', 
            'Date', 'implementation_type', 'cell_name', 'lat', 'lng', 'address'
        ];
        
        $implementationData = [];
        
        foreach ($implementationFields as $field) {
            if (isset($fieldValues[$field])) {
                // Format dates properly
                if ($field === 'Date' && !empty($fieldValues[$field])) {
                    try {
                        $implementationData[$field] = date('Y-m-d', strtotime($fieldValues[$field]));
                    } catch (\Exception $e) {
                        $implementationData[$field] = null;
                    }
                } else {
                    $implementationData[$field] = $fieldValues[$field];
                }
            }
        }
        
        return $implementationData;
    }

    /**
     * Store tracking data for an implementation
     */
    private function storeTrackingData($implementationId, $fieldValues)
    {
        // Define which fields go into the tracking table
        $trackingFields = [
            'remarks', 'artifacts', 'start_date', 'end_date'
        ];
        
        foreach ($trackingFields as $field) {
            if (isset($fieldValues[$field]) && !empty($fieldValues[$field])) {
                // Format dates properly for tracking
                $value = $fieldValues[$field];
                if (in_array($field, ['start_date', 'end_date'])) {
                    try {
                        $value = date('Y-m-d', strtotime($fieldValues[$field]));
                    } catch (\Exception $e) {
                        $value = $fieldValues[$field];
                    }
                }
                
                // Create a tracking record for each field
                ImplementationTracking::create([
                    'implementation_area_id' => $implementationId,
                    'user_id' => auth()->id() ?? 1,
                    'key' => $field,
                    'value' => $value,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }
}
