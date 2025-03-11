<?php

namespace App\Services;

use App\Models\WNTD;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WNTDImportService extends BaseImportService
{
    public function __construct()
    {
        $this->tableName = 'wntd';
        $this->historyTable = 'wntd_history';
        $this->requiredFields = ['site_name', 'wntd'];
        $this->validationRules = [
            'site_name' => 'required|string|max:255',
            'loc_id' => 'nullable|string|max:50',
            'wntd' => 'required|string|max:50',
            'imsi' => 'nullable|string|max:50',
            'version' => 'nullable|string|max:50',
            'avc' => 'nullable|string|max:255',
            'bw_profile' => 'nullable|string|max:255',
            'lon' => 'nullable|numeric',
            'lat' => 'nullable|numeric',
            'home_cell' => 'nullable|string|max:50',
            'home_pci' => 'nullable|string|max:50',
            'traffic_profile' => 'nullable|string|max:50',
            'remarks' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'solution_type' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:50'
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
            DB::beginTransaction();

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
                        Log::warning("Invalid date format for {$dateField}: " . $data[$dateField]);
                    }
                }
            }

            // Handle numeric fields
            foreach (['lon', 'lat'] as $numField) {
                if (isset($data[$numField])) {
                    $data[$numField] = is_numeric($data[$numField]) ? 
                        floatval($data[$numField]) : null;
                }
            }

            // Set default status if not provided
            if (!isset($data['status']) || empty($data['status'])) {
                $data['status'] = 'not_started';
            }

            // Check for existing record
            $existingRecord = WNTD::where('wntd', $data['wntd'])
                ->orWhere(function($query) use ($data) {
                    if (!empty($data['site_name']) && !empty($data['loc_id'])) {
                        $query->where('site_name', $data['site_name'])
                              ->where('loc_id', $data['loc_id']);
                    }
                })
                ->first();

            if ($existingRecord && $this->updateExisting) {
                // Update existing record
                $originalValues = $existingRecord->getAttributes();
                $existingRecord->fill($data);
                $existingRecord->save();

                // Track changes
                foreach ($data as $field => $value) {
                    if (isset($originalValues[$field]) && $originalValues[$field] !== $value) {
                        DB::table($this->historyTable)->insert([
                            'wntd_id' => $existingRecord->id,
                            'field_name' => $field,
                            'old_value' => $originalValues[$field],
                            'new_value' => $value,
                            'user_id' => Auth::id(),
                            'change_type' => 'update',
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }
            } else {
                // Create new record
                $wntd = new WNTD($data);
                $wntd->save();

                // Track creation
                foreach ($data as $field => $value) {
                    if (!in_array($field, ['created_at', 'updated_at'])) {
                        DB::table($this->historyTable)->insert([
                            'wntd_id' => $wntd->id,
                            'field_name' => $field,
                            'old_value' => null,
                            'new_value' => $value,
                            'user_id' => Auth::id(),
                            'change_type' => 'create',
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }
            }

            DB::commit();
            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error processing WNTD row: ' . $e->getMessage(), [
                'row' => $row,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    protected function validateRow($row)
    {
        $errors = [];

        // Check required fields
        foreach ($this->requiredFields as $field) {
            if (!isset($row[$field]) || trim($row[$field]) === '') {
                $errors[] = "Field '{$field}' is required";
            }
        }

        // Validate numeric fields
        if (isset($row['lon']) && !empty($row['lon']) && !is_numeric($row['lon'])) {
            $errors[] = "Longitude must be a number";
        }
        if (isset($row['lat']) && !empty($row['lat']) && !is_numeric($row['lat'])) {
            $errors[] = "Latitude must be a number";
        }

        // Validate dates
        foreach (['start_date', 'end_date'] as $dateField) {
            if (isset($row[$dateField]) && !empty($row[$dateField])) {
                try {
                    $date = date('Y-m-d', strtotime($row[$dateField]));
                    if ($date === false) {
                        $errors[] = "Invalid date format for {$dateField}";
                    }
                } catch (\Exception $e) {
                    $errors[] = "Invalid date format for {$dateField}";
                }
            }
        }

        return $errors;
    }
} 