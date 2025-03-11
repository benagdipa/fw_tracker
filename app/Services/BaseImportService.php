<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use League\Csv\Reader;
use PhpOffice\PhpSpreadsheet\IOFactory;

abstract class BaseImportService
{
    protected $chunkSize = 100;
    protected $validationRules = [];
    protected $requiredFields = [];
    protected $tableName;
    protected $historyTable;
    protected $updateExisting = true; // Controls whether to update existing records or skip them
    protected $importOptions = [
        'allowPartialMapping' => true,
        'skipInvalidRows' => true,
        'validateDates' => true,
        'trimWhitespace' => true,
        'forceTypeCompatibility' => true  // New option to force type compatibility
    ];

    /**
     * Set update behavior for existing records
     * 
     * @param bool $update Whether to update existing records (true) or skip them (false)
     * @return $this
     */
    public function setUpdateExisting(bool $update)
    {
        $this->updateExisting = $update;
        return $this;
    }

    /**
     * Set import options
     */
    public function setImportOptions(array $options)
    {
        $this->importOptions = array_merge($this->importOptions, $options);
        return $this;
    }

    /**
     * Import data from file
     */
    public function importFromFile($filePath, $mappings, $options = [])
    {
        try {
            $this->setImportOptions($options);
            
            $file = storage_path('app/' . $filePath);
            $extension = pathinfo($file, PATHINFO_EXTENSION);
            
            if ($extension === 'csv') {
                $data = $this->readCsvFile($file);
            } else {
                $data = $this->readExcelFile($file);
            }

            // Validate required mappings only if not allowing partial mapping
            if (!$this->importOptions['allowPartialMapping']) {
                $this->validateRequiredMappings($mappings);
            }

            // Transform data according to mappings
            $transformedData = $this->transformData($data, $mappings);

            // Clean data if needed
            if ($this->importOptions['trimWhitespace']) {
                $transformedData = $this->cleanData($transformedData);
            }

            // Validate data
            $validationResult = $this->validateData($transformedData);
            
            // If skipping invalid rows, proceed with valid data only
            if ($this->importOptions['skipInvalidRows'] && !empty($validationResult['validData'])) {
                $validData = $validationResult['validData'];
            } else if (!$validationResult['success']) {
                return [
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validationResult['errors']
                ];
            }

            // Process data in chunks
            $chunks = array_chunk($validData, $this->chunkSize);
            $totalRows = count($validData);
            $importedRows = 0;
            $failedRows = 0;
            $skippedRows = 0;
            $errors = [];
            $warnings = [];

            foreach ($chunks as $chunk) {
                try {
                    DB::beginTransaction();
                    
                    foreach ($chunk as $index => $row) {
                        try {
                            // Skip empty rows
                            if ($this->isEmptyRow($row)) {
                                $skippedRows++;
                                continue;
                            }

                            $this->processRow($row);
                            $importedRows++;
                        } catch (\Exception $e) {
                            if ($this->importOptions['skipInvalidRows']) {
                                $skippedRows++;
                                $warnings[] = [
                                    'row' => $index + 1,
                                    'warning' => $e->getMessage()
                                ];
                            } else {
                                $failedRows++;
                                $errors[] = [
                                    'row' => $index + 1,
                                    'error' => $e->getMessage()
                                ];
                            }
                        }
                    }
                    
                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error('Error processing chunk: ' . $e->getMessage());
                    $failedRows += count($chunk);
                }
            }

            return [
                'success' => true,
                'message' => "Import completed. Total: {$totalRows}, Imported: {$importedRows}, Skipped: {$skippedRows}, Failed: {$failedRows}",
                'stats' => [
                    'total' => $totalRows,
                    'imported' => $importedRows,
                    'skipped' => $skippedRows,
                    'failed' => $failedRows
                ],
                'errors' => $errors,
                'warnings' => $warnings
            ];

        } catch (\Exception $e) {
            Log::error('Import error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error during import: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Read CSV file
     */
    protected function readCsvFile($filePath)
    {
        $csv = Reader::createFromPath($filePath, 'r');
        $csv->setHeaderOffset(0);
        return iterator_to_array($csv->getRecords());
    }

    /**
     * Read Excel file
     */
    protected function readExcelFile($filePath)
    {
        $spreadsheet = IOFactory::load($filePath);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();
        
        // Extract headers and data
        $headers = array_shift($rows);
        $data = [];
        
        foreach ($rows as $row) {
            $record = [];
            foreach ($headers as $index => $header) {
                $record[$header] = $row[$index] ?? '';
            }
            $data[] = $record;
        }
        
        return $data;
    }

    /**
     * Validate required mappings
     */
    protected function validateRequiredMappings($mappings)
    {
        // Ensure mappings is an array
        if (!is_array($mappings)) {
            throw new \Exception("Column mappings must be an array");
        }

        foreach ($this->requiredFields as $field) {
            if (!isset($mappings[$field]) || empty($mappings[$field])) {
                throw new \Exception("Required field '{$field}' is not mapped");
            }
        }
    }

    /**
     * Transform data according to mappings and handle type compatibility
     */
    protected function transformData($data, $mappings)
    {
        // Ensure mappings is an array
        if (!is_array($mappings)) {
            throw new \Exception("Column mappings must be an array");
        }

        $transformed = [];
        foreach ($data as $row) {
            $transformedRow = [];
            foreach ($mappings as $dbField => $csvField) {
                // Skip if mapping is empty or invalid
                if (empty($csvField)) {
                    continue;
                }

                // Get the value from the CSV data
                $value = $row[$csvField] ?? null;
                
                if ($this->importOptions['forceTypeCompatibility']) {
                    $value = $this->enforceTypeCompatibility($dbField, $value);
                }
                
                $transformedRow[$dbField] = $value;
            }
            $transformed[] = $transformedRow;
        }
        return $transformed;
    }

    /**
     * Enforce type compatibility for a field value
     */
    protected function enforceTypeCompatibility($field, $value)
    {
        if (is_null($value) || $value === '') {
            return null;
        }

        // Get the expected type from validation rules
        $type = $this->getExpectedType($field);
        
        try {
            switch ($type) {
                case 'numeric':
                case 'integer':
                    // Try to convert to number, return null if fails
                    if (!is_numeric($value)) {
                        Log::warning("Value '{$value}' for field '{$field}' is not numeric, setting to null");
                        return null;
                    }
                    return $type === 'integer' ? (int)$value : (float)$value;

                case 'boolean':
                    // Convert various boolean representations
                    if (is_string($value)) {
                        $lower = strtolower(trim($value));
                        if (in_array($lower, ['true', '1', 'yes', 'y'])) return true;
                        if (in_array($lower, ['false', '0', 'no', 'n'])) return false;
                    }
                    return (bool)$value;

                case 'date':
                case 'datetime':
                    // Try to parse date, return null if fails
                    try {
                        return date('Y-m-d H:i:s', strtotime($value));
                    } catch (\Exception $e) {
                        Log::warning("Value '{$value}' for field '{$field}' is not a valid date, setting to null");
                        return null;
                    }

                case 'array':
                    // Handle array values
                    if (is_string($value)) {
                        // Try to parse JSON string
                        try {
                            $decoded = json_decode($value, true);
                            return is_array($decoded) ? $decoded : [$value];
                        } catch (\Exception $e) {
                            // If JSON parsing fails, split by comma
                            return array_map('trim', explode(',', $value));
                        }
                    }
                    return is_array($value) ? $value : [$value];

                case 'string':
                    // Convert any value to string, except null
                    return $value !== null ? (string)$value : null;

                default:
                    // For unknown types, return as is
                    return $value;
            }
        } catch (\Exception $e) {
            Log::warning("Error converting value '{$value}' for field '{$field}': {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Get expected type for a field from validation rules
     */
    protected function getExpectedType($field)
    {
        if (!isset($this->validationRules[$field])) {
            return 'string'; // Default type
        }

        $rules = is_array($this->validationRules[$field]) 
            ? $this->validationRules[$field] 
            : explode('|', $this->validationRules[$field]);

        $typeMap = [
            'numeric' => 'numeric',
            'integer' => 'integer',
            'boolean' => 'boolean',
            'date' => 'date',
            'datetime' => 'datetime',
            'array' => 'array',
            'json' => 'array',
            'string' => 'string'
        ];

        foreach ($rules as $rule) {
            $ruleName = is_string($rule) ? strtolower($rule) : '';
            if (isset($typeMap[$ruleName])) {
                return $typeMap[$ruleName];
            }
        }

        return 'string'; // Default type if no type rule found
    }

    /**
     * Validate data with more flexible type handling
     */
    protected function validateData($data)
    {
        $errors = [];
        $validData = [];
        $warnings = [];
        
        foreach ($data as $index => $row) {
            try {
                $validatedRow = $row;
                $rowWarnings = [];
                
                // Check each field against validation rules
                foreach ($this->validationRules as $field => $rules) {
                    if (!isset($validatedRow[$field])) {
                        continue;
                    }

                    $validator = Validator::make(
                        [$field => $validatedRow[$field]], 
                        [$field => $rules]
                    );

                    if ($validator->fails()) {
                        if ($this->importOptions['forceTypeCompatibility']) {
                            // If validation fails, set to null and add warning
                            $rowWarnings[] = "Field '{$field}' value '{$validatedRow[$field]}' is invalid, setting to null";
                            $validatedRow[$field] = null;
                        } else {
                            $errors[] = [
                                'row' => $index + 1,
                                'errors' => $validator->errors()->toArray()
                            ];
                            continue 2; // Skip to next row
                        }
                    }
                }
                
                // Add warnings if any
                if (!empty($rowWarnings)) {
                    $warnings[] = [
                        'row' => $index + 1,
                        'warnings' => $rowWarnings
                    ];
                }
                
                // Perform custom validation if method exists
                if (method_exists($this, 'validateRow')) {
                    try {
                        $validatedRow = $this->validateRow($validatedRow);
                    } catch (\Exception $e) {
                        if ($this->importOptions['skipInvalidRows']) {
                            $warnings[] = [
                                'row' => $index + 1,
                                'warning' => $e->getMessage()
                            ];
                            continue;
                        } else {
                            throw $e;
                        }
                    }
                }
                
                $validData[] = $validatedRow;
            } catch (\Exception $e) {
                $errors[] = [
                    'row' => $index + 1,
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'success' => empty($errors) || $this->importOptions['skipInvalidRows'],
            'errors' => $errors,
            'warnings' => $warnings,
            'validData' => $validData
        ];
    }

    /**
     * Process a single row of data
     */
    abstract protected function processRow($row);

    /**
     * Clean data by trimming whitespace and handling special characters
     */
    protected function cleanData($data)
    {
        return array_map(function($row) {
            return array_map(function($value) {
                if (is_string($value)) {
                    return trim($value);
                }
                return $value;
            }, $row);
        }, $data);
    }

    /**
     * Check if a row is empty (all values are null or empty strings)
     */
    protected function isEmptyRow($row)
    {
        return empty(array_filter($row, function($value) {
            return !is_null($value) && $value !== '';
        }));
    }
} 