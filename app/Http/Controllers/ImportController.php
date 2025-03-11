<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use League\Csv\Reader;
use Illuminate\Support\Facades\Validator;

class ImportController extends Controller
{
    /**
     * Preview file headers
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function preview(Request $request)
    {
        try {
            // Validate request with less strict file type validation
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'file' => 'required|file',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed: Please provide a valid file',
                    'errors' => $validator->errors()
                ], 422);
            }

            if (!$request->hasFile('file')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No file uploaded',
                ], 400);
            }

            $file = $request->file('file');
            $extension = $file->getClientOriginalExtension();
            
            // Log file details for debugging
            \Illuminate\Support\Facades\Log::info('File received for preview', [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'extension' => $extension,
                'mime' => $file->getMimeType()
            ]);
            
            // Store the file temporarily
            $filePath = $file->store('temp');
            $fullPath = \Illuminate\Support\Facades\Storage::path($filePath);
            
            // Get headers based on file type
            $headers = [];
            
            // Process based on file extension, handle more formats
            if (in_array(strtolower($extension), ['csv', 'txt'])) {
                $headers = $this->getHeadersFromCsv($fullPath);
            } elseif (in_array(strtolower($extension), ['xlsx', 'xls'])) {
                $headers = $this->getHeadersFromExcel($fullPath);
            } else {
                // Try to infer format from content
                $headers = $this->inferFileFormat($fullPath);
            }
            
            // If no headers found, return error
            if (empty($headers)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to extract headers from file'
                ], 400);
            }
            
            // Get a sample of data rows (up to 3 rows)
            $preview = $this->getPreviewData($fullPath, $extension, $headers);
            
            // Clean up the temporary file
            \Illuminate\Support\Facades\Storage::delete($filePath);
            
            return response()->json([
                'success' => true,
                'header' => $headers,
                'preview' => $preview
            ]);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error previewing import file: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error previewing file: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get headers from a CSV file
     * 
     * @param string $filePath
     * @return array
     */
    private function getHeadersFromCsv($filePath)
    {
        try {
            // Add more robust error handling
            if (!file_exists($filePath)) {
                \Illuminate\Support\Facades\Log::error("File does not exist: $filePath");
                return [];
            }
            
            // Get file size
            $fileSize = filesize($filePath);
            if ($fileSize === 0) {
                \Illuminate\Support\Facades\Log::error("File is empty: $filePath");
                return [];
            }
            
            // Try League CSV reader
            try {
                $csv = Reader::createFromPath($filePath, 'r');
                $csv->setHeaderOffset(0);
                
                // Get headers from the first row
                return $csv->getHeader();
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("League CSV failed: " . $e->getMessage());
                
                // Fallback to manual CSV parsing
                $handle = fopen($filePath, 'r');
                if ($handle === false) {
                    \Illuminate\Support\Facades\Log::error("Cannot open file: $filePath");
                    return [];
                }
                
                // Get the first line
                $firstLine = fgets($handle);
                fclose($handle);
                
                if ($firstLine === false) {
                    \Illuminate\Support\Facades\Log::error("Cannot read first line from: $filePath");
                    return [];
                }
                
                // Parse CSV manually
                $headers = str_getcsv($firstLine);
                return $headers;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error reading CSV headers: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return [];
        }
    }
    
    /**
     * Get headers from an Excel file
     * 
     * @param string $filePath
     * @return array
     */
    private function getHeadersFromExcel($filePath)
    {
        try {
            // Add more robust error handling
            if (!file_exists($filePath)) {
                \Illuminate\Support\Facades\Log::error("File does not exist: $filePath");
                return [];
            }
            
            // Get file size
            $fileSize = filesize($filePath);
            if ($fileSize === 0) {
                \Illuminate\Support\Facades\Log::error("File is empty: $filePath");
                return [];
            }
            
            // Try to load the Excel file
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $headers = [];
            
            // Get the highest column index
            $highestColumn = $worksheet->getHighestColumn();
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);
            
            // Get headers from the first row
            for ($col = 1; $col <= $highestColumnIndex; $col++) {
                $cellValue = $worksheet->getCellByColumnAndRow($col, 1)->getValue();
                if ($cellValue) {
                    $headers[] = $cellValue;
                }
            }
            
            return $headers;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error reading Excel headers: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return [];
        }
    }
    
    /**
     * Get preview data from a file (first few rows)
     * 
     * @param string $filePath
     * @param string $extension
     * @param array $headers
     * @return array
     */
    private function getPreviewData($filePath, $extension, $headers)
    {
        $preview = [];
        $maxRows = 3; // Show up to 3 rows for preview
        
        try {
            // Add more robust error handling
            if (!file_exists($filePath)) {
                \Illuminate\Support\Facades\Log::error("File does not exist: $filePath");
                return $preview;
            }
            
            // Get file size
            $fileSize = filesize($filePath);
            if ($fileSize === 0) {
                \Illuminate\Support\Facades\Log::error("File is empty: $filePath");
                return $preview;
            }
            
            // Process based on file extension, handle more formats
            if (in_array(strtolower($extension), ['csv', 'txt'])) {
                try {
                    $csv = Reader::createFromPath($filePath, 'r');
                    $csv->setHeaderOffset(0);
                    
                    $records = $csv->getRecords();
                    $count = 0;
                    
                    foreach ($records as $record) {
                        if ($count >= $maxRows) break;
                        $preview[] = $record;
                        $count++;
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning("League CSV failed for preview: " . $e->getMessage());
                    
                    // Fallback to manual CSV parsing
                    $handle = fopen($filePath, 'r');
                    if ($handle !== false) {
                        // Skip header row
                        fgets($handle);
                        
                        // Read data rows
                        $count = 0;
                        while (($data = fgetcsv($handle)) !== false && $count < $maxRows) {
                            $row = [];
                            foreach ($data as $index => $value) {
                                $header = isset($headers[$index]) ? $headers[$index] : "Column" . ($index + 1);
                                $row[$header] = $value;
                            }
                            $preview[] = $row;
                            $count++;
                        }
                        fclose($handle);
                    }
                }
            } else {
                try {
                    $spreadsheet = IOFactory::load($filePath);
                    $worksheet = $spreadsheet->getActiveSheet();
                    
                    $highestColumn = $worksheet->getHighestColumn();
                    $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);
                    
                    for ($row = 2; $row <= min($maxRows + 1, $worksheet->getHighestRow()); $row++) {
                        $rowData = [];
                        
                        for ($col = 1; $col <= $highestColumnIndex; $col++) {
                            $header = isset($headers[$col-1]) ? $headers[$col-1] : "Column$col";
                            $value = $worksheet->getCellByColumnAndRow($col, $row)->getValue();
                            $rowData[$header] = $value;
                        }
                        
                        $preview[] = $rowData;
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning("Excel preview failed: " . $e->getMessage());
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Error getting preview data: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        }
        
        return $preview;
    }
    
    /**
     * Try to infer the file format from its content
     * 
     * @param string $filePath
     * @return array
     */
    private function inferFileFormat($filePath)
    {
        try {
            // First try CSV
            $headers = $this->getHeadersFromCsv($filePath);
            if (!empty($headers)) {
                return $headers;
            }
            
            // Then try Excel
            return $this->getHeadersFromExcel($filePath);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to infer file format: ' . $e->getMessage());
            return [];
        }
    }
} 