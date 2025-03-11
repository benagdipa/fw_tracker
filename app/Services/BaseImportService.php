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

    /**
     * Import data from file
     *
     * @param string $filePath
     * @param array $mappings
     * @return array
     */
    public function importFromFile($filePath, $mappings)
    {
        try {
            $file = storage_path('app/' . $filePath);
            $extension = pathinfo($file, PATHINFO_EXTENSION);
            
            if ($extension === 'csv') {
                $data = $this->readCsvFile($file);
            } else {
                $data = $this->readExcelFile($file);
            }

            // Validate required fields are mapped
            $this->validateRequiredMappings($mappings);

            // Transform data according to mappings
            $transformedData = $this->transformData($data, $mappings);

            // Validate data
            $validationResult = $this->validateData($transformedData);
            if (!$validationResult['success']) {
                return [
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validationResult['errors']
                ];
            }

            // Process data in chunks
            $chunks = array_chunk($transformedData, $this->chunkSize);
            $totalRows = count($transformedData);
            $importedRows = 0;
            $failedRows = 0;
            $errors = [];

            foreach ($chunks as $chunk) {
                try {
                    DB::beginTransaction();
                    
                    foreach ($chunk as $row) {
                        try {
                            $this->processRow($row);
                            $importedRows++;
                        } catch (\Exception $e) {
                            $failedRows++;
                            $errors[] = [
                                'row' => $row,
                                'error' => $e->getMessage()
                            ];
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
                'message' => "Import completed. Total: {$totalRows}, Imported: {$importedRows}, Failed: {$failedRows}",
                'stats' => [
                    'total' => $totalRows,
                    'imported' => $importedRows,
                    'failed' => $failedRows
                ],
                'errors' => $errors
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
        foreach ($this->requiredFields as $field) {
            if (!in_array($field, array_values($mappings))) {
                throw new \Exception("Required field '{$field}' is not mapped");
            }
        }
    }

    /**
     * Transform data according to mappings
     */
    protected function transformData($data, $mappings)
    {
        $transformed = [];
        foreach ($data as $row) {
            $transformedRow = [];
            foreach ($mappings as $dbField => $csvField) {
                $transformedRow[$dbField] = $row[$csvField] ?? null;
            }
            $transformed[] = $transformedRow;
        }
        return $transformed;
    }

    /**
     * Validate data
     */
    protected function validateData($data)
    {
        $errors = [];
        foreach ($data as $index => $row) {
            $validator = Validator::make($row, $this->validationRules);
            if ($validator->fails()) {
                $errors[] = [
                    'row' => $index + 1,
                    'errors' => $validator->errors()->toArray()
                ];
            }
        }

        return [
            'success' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Process a single row of data
     */
    abstract protected function processRow($row);
} 