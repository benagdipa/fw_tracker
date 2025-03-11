<?php

namespace App\Services;

use App\Models\Implementation;
use App\Models\ImplementationTracking;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImplementationImportService extends BaseImportService
{
    public function __construct()
    {
        $this->tableName = 'implementations';
        $this->historyTable = 'implementation_history';
        $this->requiredFields = ['site_name', 'category', 'status'];
        $this->validationRules = [
            'site_name' => 'required|string|max:255',
            'cell_name' => 'nullable|string|max:255',
            'category' => 'required|string|max:50',
            'implementor' => 'nullable|string|max:255',
            'status' => 'required|string|max:50',
            'notes' => 'nullable|string',
            'enm_scripts_path' => 'nullable|string|max:255',
            'sp_scripts_path' => 'nullable|string|max:255',
            'CRQ' => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'address' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric'
        ];

        // Set import options for more flexible handling
        $this->setImportOptions([
            'allowPartialMapping' => true,
            'skipInvalidRows' => true,
            'validateDates' => true,
            'trimWhitespace' => true,
            'forceTypeCompatibility' => true
        ]);
    }

    protected function processRow($row)
    {
        try {
            // Clean and prepare the data
            $data = array_map(function($value) {
                return $value === '' ? null : $value;
            }, $row);

            // Handle dates
            foreach (['start_date', 'end_date'] as $dateField) {
                if (isset($data[$dateField]) && $data[$dateField]) {
                    try {
                        $data[$dateField] = date('Y-m-d', strtotime($data[$dateField]));
                    } catch (\Exception $e) {
                        $data[$dateField] = null;
                    }
                }
            }

            // Handle numeric fields
            foreach (['lat', 'lng'] as $numField) {
                if (isset($data[$numField])) {
                    $data[$numField] = is_numeric($data[$numField]) ? 
                        floatval($data[$numField]) : null;
                }
            }

            // Check for existing record if update is enabled
            $existingRecord = null;
            if ($this->updateExisting) {
                $existingRecord = DB::table($this->tableName)
                    ->where('site_name', $data['site_name'])
                    ->where('category', $data['category'])
                    ->first();
            }

            if ($existingRecord && $this->updateExisting) {
                // Update existing record
                $data['updated_at'] = now();
                DB::table($this->tableName)
                    ->where('id', $existingRecord->id)
                    ->update($data);

                // Track changes in history
                $this->trackChanges($existingRecord->id, $existingRecord, $data);
            } else {
                // Create new record
                $data['created_at'] = now();
                $data['updated_at'] = now();
                
                $id = DB::table($this->tableName)->insertGetId($data);
                
                // Track creation in history
                $this->trackCreation($id, $data);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Error processing Implementation row: ' . $e->getMessage(), [
                'row' => $row,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    protected function trackChanges($id, $old, $new)
    {
        $changes = [];
        foreach ($new as $field => $value) {
            if (isset($old->$field) && $old->$field !== $value) {
                $changes[] = [
                    'implementation_id' => $id,
                    'field_name' => $field,
                    'old_value' => $old->$field,
                    'new_value' => $value,
                    'user_id' => auth()->id(),
                    'change_type' => 'update',
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }
        }

        if (!empty($changes)) {
            DB::table($this->historyTable)->insert($changes);
        }
    }

    protected function trackCreation($id, $data)
    {
        $history = [];
        foreach ($data as $field => $value) {
            if (!in_array($field, ['created_at', 'updated_at'])) {
                $history[] = [
                    'implementation_id' => $id,
                    'field_name' => $field,
                    'old_value' => null,
                    'new_value' => $value,
                    'user_id' => auth()->id(),
                    'change_type' => 'create',
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }
        }

        if (!empty($history)) {
            DB::table($this->historyTable)->insert($history);
        }
    }

    /**
     * Save tracking fields for an implementation
     */
    private function saveTrackingFields($implementationId, $row)
    {
        $trackingFields = ['category', 'status', 'start_date', 'end_date', 'progress', 'notes', 'assigned_to'];
        $trackingData = [];

        foreach ($trackingFields as $field) {
            if (isset($row[$field]) && !empty($row[$field])) {
                $trackingData[$field] = $row[$field];
            }
        }

        if (!empty($trackingData)) {
            $trackingData['implementation_id'] = $implementationId;
            $trackingData['user_id'] = Auth::id();
            
            ImplementationTracking::create($trackingData);
        }
    }

    /**
     * Log changes to implementation
     */
    private function logChange($implementation_id, $action, $before = null, $after = null)
    {
        DB::table($this->historyTable)->insert([
            'implementation_id' => $implementation_id,
            'user_id' => Auth::id(),
            'action' => $action,
            'before' => $before ? json_encode($before) : null,
            'after' => $after ? json_encode($after) : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Validate a single row of data
     *
     * @param array $row
     * @return array
     */
    protected function validateRow($row)
    {
        // Make sure required fields are present
        foreach ($this->requiredFields as $field) {
            if (!isset($row[$field]) || empty($row[$field])) {
                throw new \Exception("Missing required field: {$field}");
            }
        }

        // Validate status values
        if (isset($row['status']) && !empty($row['status'])) {
            $validStatuses = ['not_started', 'in_progress', 'completed', 'blocked'];
            if (!in_array($row['status'], $validStatuses)) {
                throw new \Exception("Invalid status value: {$row['status']}. Must be one of: " . implode(', ', $validStatuses));
            }
        }

        // Validate category values
        if (isset($row['category']) && !empty($row['category'])) {
            $validCategories = ['Parameters', 'Retunes', 'ENDC_associations', 'nr-nr_associations'];
            if (!in_array($row['category'], $validCategories)) {
                throw new \Exception("Invalid category value: {$row['category']}. Must be one of: " . implode(', ', $validCategories));
            }
        }
        
        // Validate latitude and longitude if present
        if (isset($row['lat']) && !empty($row['lat'])) {
            if (!is_numeric($row['lat']) || $row['lat'] < -90 || $row['lat'] > 90) {
                throw new \Exception("Invalid latitude value: {$row['lat']}. Must be between -90 and 90.");
            }
        }
        
        if (isset($row['lng']) && !empty($row['lng'])) {
            if (!is_numeric($row['lng']) || $row['lng'] < -180 || $row['lng'] > 180) {
                throw new \Exception("Invalid longitude value: {$row['lng']}. Must be between -180 and 180.");
            }
        }
        
        // Validate dates if present
        if (isset($row['start_date']) && !empty($row['start_date'])) {
            try {
                $startDate = new \DateTime($row['start_date']);
            } catch (\Exception $e) {
                throw new \Exception("Invalid start date format: {$row['start_date']}. Use YYYY-MM-DD format.");
            }
        }
        
        if (isset($row['end_date']) && !empty($row['end_date'])) {
            try {
                $endDate = new \DateTime($row['end_date']);
                
                if (isset($startDate) && $endDate < $startDate) {
                    throw new \Exception("End date cannot be before start date.");
                }
            } catch (\Exception $e) {
                if ($e->getMessage() == "End date cannot be before start date.") {
                    throw $e;
                }
                throw new \Exception("Invalid end date format: {$row['end_date']}. Use YYYY-MM-DD format.");
            }
        }
        
        return $row;
    }
} 