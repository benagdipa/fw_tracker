<?php

namespace App\Services;

use App\Models\RANParameter;
use App\Models\RANStructParameter;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\Log;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Service for handling RAN data import operations
 */
class RANImportService extends BaseImportService
{
    protected $type;

    public function __construct($type = 'parameter')
    {
        $this->type = $type;
        $this->tableName = $type === 'struct' ? 'ran_struct_parameters' : 'ran_parameters';
        $this->historyTable = 'ran_parameter_history';
        
        if ($type === 'struct') {
            $this->requiredFields = ['model', 'mo_class_name', 'parameter_name'];
            $this->validationRules = [
                'model' => 'required|string|max:255',
                'mo_class_name' => 'required|string|max:255',
                'parameter_name' => 'required|string|max:255',
                'seq' => 'nullable|integer',
                'technology' => 'nullable|string|max:50',
                'vendor' => 'nullable|string|max:100',
                'status' => 'nullable|string|max:50'
            ];
        } else {
            $this->requiredFields = ['parameter_id', 'parameter_name', 'parameter_value'];
            $this->validationRules = [
                'parameter_id' => 'required|string|max:50',
                'parameter_name' => 'required|string|max:255',
                'parameter_value' => 'required|string',
                'description' => 'nullable|string',
                'domain' => 'nullable|string|max:255',
                'data_type' => 'nullable|string|max:50',
                'value_range' => 'nullable|string',
                'mo_reference' => 'nullable|string|max:255',
                'default_value' => 'nullable|string',
                'category' => 'nullable|string|max:100',
                'technology' => 'nullable|string|max:50',
                'vendor' => 'nullable|string|max:100',
                'applicability' => 'nullable|string|max:255',
                'status' => 'nullable|string|max:50',
                'type' => 'nullable|string|max:50',
                'value' => 'nullable|string',
                'unit' => 'nullable|string|max:50'
            ];
        }

        // Set import options for more flexible handling
        $this->setImportOptions([
            'allowPartialMapping' => true,
            'skipInvalidRows' => true,
            'validateDates' => true,
            'trimWhitespace' => true,
            'forceTypeCompatibility' => true
        ]);
    }

    /**
     * Validate file before import
     *
     * @param string $filePath Path to the file
     * @throws \Exception If the file is empty or invalid
     */
    private function validateFile(string $filePath): void
    {
        // Check if file exists
        if (!file_exists($filePath)) {
            throw new Exception("File does not exist: {$filePath}");
        }
        
        // Check if file is empty
        if (filesize($filePath) === 0) {
            throw new Exception("File is empty: {$filePath}");
        }
        
        // Try to load the file to verify it's a valid spreadsheet
        try {
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            
            // Check if there's any data in the worksheet
            $highestRow = $worksheet->getHighestRow();
            if ($highestRow <= 1) { // Only header or empty
                throw new Exception("File contains no data rows");
            }
        } catch (Exception $e) {
            throw new Exception("Invalid spreadsheet file: " . $e->getMessage());
        }
    }

    /**
     * Import data from Excel file
     *
     * @param string $filePath Path to the Excel file
     * @param string $targetTable Target table name (struct_parameters or parameters)
     * @param array $columnMappings Mappings from source columns to target columns
     * @return array Import results with success count, errors, etc.
     * @throws \Exception If the file cannot be read or the sheet is not found
     */
    public function importFromExcel(string $filePath, string $targetTable, array $columnMappings): array
    {
        try {
            // Validate file
            $this->validateFile($filePath);
            
            // Load the spreadsheet
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            
            $rowCount = $worksheet->getHighestRow();
            $successCount = 0;
            $failedCount = 0;
            $errors = [];
            
            // Start from row 2 to skip headers
            for ($row = 2; $row <= $rowCount; $row++) {
                try {
                    $rowData = $this->extractRowData($worksheet, $row, $columnMappings, $targetTable);
                    
                    // Skip if no data
                    if (empty($rowData)) {
                        continue;
                    }
                    
                    // Insert the data
                    $this->processRow($rowData);
                    
                    $successCount++;
                } catch (Exception $e) {
                    $failedCount++;
                    $errors[] = "Error on row {$row}: " . $e->getMessage();
                    Log::error("RAN Import Error on row {$row}", [
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine()
                    ]);
                }
            }
            
            return [
                'success' => true,
                'message' => "Import completed. Imported {$successCount} records, failed {$failedCount} records.",
                'successCount' => $successCount,
                'failedCount' => $failedCount,
                'errors' => $errors
            ];
        } catch (Exception $e) {
            Log::error("RAN Import Error", [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            throw new Exception("Error importing data: " . $e->getMessage());
        }
    }
    
    /**
     * Extract data from a row
     *
     * @param \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $worksheet The worksheet
     * @param int $row Row number
     * @param array $columnMappings Column mappings
     * @param string $targetTable Target table name
     * @return array Extracted row data
     */
    private function extractRowData($worksheet, int $row, array $columnMappings, string $targetTable): array
    {
        $rowData = [];
        
        // Prepare data for insertion
        foreach ($columnMappings as $sourceColumn => $targetColumn) {
            // Skip if target column is empty
            if (empty($targetColumn)) {
                continue;
            }
            
            // Get column index from column name
            $columnIndex = array_search($sourceColumn, array_keys($columnMappings));
            if ($columnIndex === false) {
                continue;
            }
            
            // Get cell value
            $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex + 1);
            $cellValue = $worksheet->getCell($columnLetter . $row)->getValue();
            
            // Process boolean values
            if (in_array($targetColumn, ['mul']) && ($targetTable === 'struct_parameters')) {
                // Handle different representations of boolean values
                if (is_string($cellValue)) {
                    $lowerValue = strtolower(trim($cellValue));
                    if (in_array($lowerValue, ['true', 'yes', 'y', '1', 'on'])) {
                        $cellValue = true;
                    } elseif (in_array($lowerValue, ['false', 'no', 'n', '0', 'off', ''])) {
                        $cellValue = false;
                    } else {
                        $cellValue = filter_var($cellValue, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                        $cellValue = $cellValue === null ? false : $cellValue;
                    }
                } elseif (is_numeric($cellValue)) {
                    $cellValue = (bool)(int)$cellValue;
                } elseif ($cellValue === null) {
                    $cellValue = false;
                }
            }
            
            $rowData[$targetColumn] = $cellValue;
        }
        
        return $rowData;
    }

    protected function processRow($row)
    {
        try {
            // Clean and prepare the data
            $data = array_map(function($value) {
                return $value === '' ? null : $value;
            }, $row);

            // Handle special fields based on type
            if ($this->type === 'struct') {
                if (isset($data['seq'])) {
                    $data['seq'] = is_numeric($data['seq']) ? (int)$data['seq'] : null;
                }
            } else {
                // Handle parameter value type conversion
                if (isset($data['data_type']) && isset($data['parameter_value'])) {
                    $data['parameter_value'] = $this->convertValueToType(
                        $data['parameter_value'],
                        $data['data_type']
                    );
                }
            }

            // Check for existing record if update is enabled
            $existingRecord = null;
            if ($this->updateExisting) {
                $query = DB::table($this->tableName);
                
                if ($this->type === 'struct') {
                    $query->where('model', $data['model'])
                          ->where('mo_class_name', $data['mo_class_name'])
                          ->where('parameter_name', $data['parameter_name']);
                } else {
                    $query->where('parameter_id', $data['parameter_id']);
                }
                
                $existingRecord = $query->first();
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
            Log::error('Error processing RAN Configuration row: ' . $e->getMessage(), [
                'row' => $row,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    protected function convertValueToType($value, $type)
    {
        if (is_null($value) || $value === '') {
            return null;
        }

        try {
            switch (strtolower($type)) {
                case 'integer':
                    return is_numeric($value) ? (int)$value : null;
                case 'float':
                case 'decimal':
                    return is_numeric($value) ? (float)$value : null;
                case 'boolean':
                    if (is_string($value)) {
                        $lower = strtolower(trim($value));
                        if (in_array($lower, ['true', '1', 'yes', 'y'])) return true;
                        if (in_array($lower, ['false', '0', 'no', 'n'])) return false;
                    }
                    return (bool)$value;
                case 'array':
                case 'json':
                    if (is_string($value)) {
                        try {
                            return json_decode($value, true) ?: [$value];
                        } catch (\Exception $e) {
                            return array_map('trim', explode(',', $value));
                        }
                    }
                    return is_array($value) ? $value : [$value];
                default:
                    return (string)$value;
            }
        } catch (\Exception $e) {
            Log::warning("Error converting value '{$value}' to type '{$type}': {$e->getMessage()}");
            return null;
        }
    }

    protected function trackChanges($id, $old, $new)
    {
        $changes = [];
        foreach ($new as $field => $value) {
            if (isset($old->$field) && $old->$field !== $value) {
                $changes[] = [
                    'parameter_id' => $id,
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
                    'parameter_id' => $id,
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
     * Validate a single row of data for structure parameters
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
        
        if ($this->type === 'struct') {
            return $this->validateStructParameterRow($row);
        } else {
            return $this->validateParameterRow($row);
        }
    }
    
    /**
     * Validate a structure parameter row
     * 
     * @param array $row
     * @return array
     */
    private function validateStructParameterRow($row)
    {
        // Validate sequence if present
        if (isset($row['seq']) && !empty($row['seq'])) {
            if (!is_numeric($row['seq']) || intval($row['seq']) < 0) {
                throw new \Exception("Invalid sequence value: {$row['seq']}. Must be a positive integer.");
            }
        }
        
        // Validate multiple values field if present
        if (isset($row['mul']) && !empty($row['mul'])) {
            $validValues = ['Yes', 'No', 'yes', 'no', 'Y', 'N', 'true', 'false', '1', '0'];
            if (!in_array($row['mul'], $validValues)) {
                throw new \Exception("Invalid multiple values indicator: {$row['mul']}. Use Yes/No or true/false.");
            }
            
            // Normalize to boolean-compatible value
            if (in_array($row['mul'], ['Yes', 'yes', 'Y', 'true', '1'])) {
                $row['mul'] = true;
            } else {
                $row['mul'] = false;
            }
        }
        
        // Basic validation for management class
        if (isset($row['manc']) && !empty($row['manc'])) {
            $validValues = ['M', 'O', 'C', 'P'];
            if (!in_array($row['manc'], $validValues)) {
                throw new \Exception("Invalid management class: {$row['manc']}. Must be one of: " . implode(', ', $validValues));
            }
        }
        
        return $row;
    }
    
    /**
     * Validate a parameter row
     * 
     * @param array $row
     * @return array
     */
    private function validateParameterRow($row)
    {
        // Validate parameter ID format
        if (isset($row['parameter_id']) && !empty($row['parameter_id'])) {
            // Example validation for a specific format like P001, P002, etc.
            if (!preg_match('/^[A-Za-z][0-9]{3,}$/', $row['parameter_id'])) {
                // This is just a warning, not a hard error
                Log::warning("Parameter ID {$row['parameter_id']} doesn't follow the recommended format (letter followed by numbers)");
            }
        }
        
        // Validate technology if present
        if (isset($row['technology']) && !empty($row['technology'])) {
            $validTechnologies = ['LTE', 'NR', '4G', '5G', '3G'];
            if (!in_array($row['technology'], $validTechnologies)) {
                throw new \Exception("Invalid technology: {$row['technology']}. Must be one of: " . implode(', ', $validTechnologies));
            }
        }
        
        // Validate status if present
        if (isset($row['status']) && !empty($row['status'])) {
            $validStatuses = ['Active', 'Inactive', 'Deprecated', 'Draft'];
            if (!in_array($row['status'], $validStatuses)) {
                throw new \Exception("Invalid status: {$row['status']}. Must be one of: " . implode(', ', $validStatuses));
            }
        }
        
        return $row;
    }
}