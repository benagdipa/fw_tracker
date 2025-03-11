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
        if ($type === 'struct') {
            $this->tableName = 'ran_struct_parameters';
            $this->historyTable = 'ran_parameter_history';
            $this->requiredFields = ['parameter_name', 'mo_class_name'];
            $this->validationRules = [
                'model' => 'required|string|max:50',
                'mo_class_name' => 'required|string|max:100',
                'parameter_name' => 'required|string|max:100',
                'seq' => 'nullable|integer',
                'parameter_description' => 'nullable|string',
                'data_type' => 'nullable|string|max:50',
                'range' => 'nullable|string|max:100',
                'def' => 'nullable|string|max:50',
                'mul' => 'nullable|boolean',
                'unit' => 'nullable|string|max:50',
                'rest' => 'nullable|string|max:50',
                'read' => 'nullable|string|max:10',
                'restr' => 'nullable|string|max:50',
                'manc' => 'nullable|string|max:10',
                'pers' => 'nullable|string|max:10',
                'syst' => 'nullable|string|max:10',
                'change' => 'nullable|string|max:10',
                'dist' => 'nullable|string|max:10',
                'dependencies' => 'nullable|string',
                'dep' => 'nullable|string|max:10',
                'obs' => 'nullable|string',
                'prec' => 'nullable|string|max:10'
            ];
        } else {
            $this->tableName = 'ran_parameters';
            $this->historyTable = 'ran_parameter_history';
            $this->requiredFields = ['parameter_id', 'parameter_name'];
            $this->validationRules = [
                'parameter_id' => 'required|string|max:50',
                'parameter_name' => 'required|string|max:100',
                'parameter_value' => 'required|string',
                'description' => 'nullable|string',
                'domain' => 'nullable|string|max:100',
                'data_type' => 'nullable|string|max:50',
                'mo_reference' => 'nullable|string|max:100',
                'default_value' => 'nullable|string|max:50',
                'category' => 'nullable|string|max:50',
                'technology' => 'nullable|string|max:50',
                'vendor' => 'nullable|string|max:50',
                'applicability' => 'nullable|string|max:50',
                'status' => 'nullable|string|max:20'
            ];
        }
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
        if ($this->type === 'struct') {
            $parameter = RANStructParameter::create($row);
        } else {
            // Validate parameter value against range if specified
            if (isset($row['domain'])) {
                $range = explode('-', $row['domain']);
                if (count($range) === 2) {
                    $min = floatval($range[0]);
                    $max = floatval($range[1]);
                    $value = floatval($row['parameter_value']);
                    
                    if ($value < $min || $value > $max) {
                        throw new \Exception("Parameter value must be between {$min} and {$max}");
                    }
                }
            }
            
            $parameter = RANParameter::create($row);
        }
        
        // Track creation in history
        foreach ($row as $field => $value) {
            if (!in_array($field, ['created_at', 'updated_at'])) {
                DB::table($this->historyTable)->insert([
                    'parameter_id' => $parameter->id,
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

        return $parameter;
    }
}