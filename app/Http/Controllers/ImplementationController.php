<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessImplementationFieldImport;
use App\Models\AdditionalColumn;
use App\Models\ColumnOption;
use App\Models\Implementation;
use App\Models\ImplementationTracking;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use League\Csv\Reader;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Support\Facades\DB;
use App\Services\ImplementationImportService;


class ImplementationController extends Controller
{
    public function index(Request $request)
    {
        $order = $request->input('order');
        $order_by = $request->input('order_by') ? $request->input('order_by') : 'id';
        $search_query = $request->input('search');
        $per_page = $request->input('per_page') && strtolower($request->input('per_page')) === 'all' ? PHP_INT_MAX : ($request->input('per_page') ? $request->input('per_page') : 10);
        
        // Ensure we're using the correct table
        $implementation = new Implementation();
        $implementation->setTable('implementations');
        $tableName = $implementation->getTable();
        
        if ($search_query) {
            $columns = \Schema::getColumnListing($tableName);
            $Implementations = Implementation::where(function ($query) use ($search_query, $columns) {
                foreach ($columns as $column) {
                    $query->orWhere($column, 'LIKE', '%' . $search_query . '%');
                }
            })->orderBy($order_by, $order ? $order : 'asc')->paginate($per_page);

        } elseif ($request->input('filter_by') && $request->input('value')) {
            $Implementations = Implementation::whereHas('tracking', function ($query) use ($request) {
                $query->where('key', $request->input('filter_by'));
                $query->where('value', $request->input('value'));
            })->orderBy($order_by, $order ? $order : 'asc')->paginate($per_page);
        } else {
            $Implementations = Implementation::orderBy($order_by, $order ? $order : 'asc')->paginate($per_page);
        }

        $desiredKeys = ['category', 'status', 'Date'];
        foreach ($Implementations as $Implementation) {
            $tracking_data = ImplementationTracking::where('implementation_area_id', $Implementation->id)
                ->whereIn('key', $desiredKeys)
                ->get()
                ->keyBy('key')
                ->toArray();
            foreach ($tracking_data as $key => $value) {
                $Implementation->{$key} = $value['value'];
            }
        }

        return Inertia::render('Implementation/Index', [
            'implementations' => $Implementations,
            'get_data' => $request->all()
        ]);
    }

    /**
     * Save tracking fields to ImplementationTracking table
     *
     * @param int $implementationId
     * @param array $data
     * @return void
     */
    private function saveTrackingFields($implementationId, $data)
    {
        $trackingFields = [
            'category',
            'status',
            'Date'
        ];
        
        foreach ($trackingFields as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                // Get current user ID, default to 1 if not authenticated
                $userId = auth()->check() ? auth()->id() : 1;
                
                // Format dates properly for storage
                $value = $data[$field];
                if ($field === 'Date') {
                    if (!empty($value) && !is_string($value)) {
                        $value = date('Y-m-d', strtotime($value));
                    }
                }
                
                // Check if tracking record exists
                $existingTracking = ImplementationTracking::where('implementation_area_id', $implementationId)
                    ->where('key', $field)
                    ->first();
                
                // Only create a new tracking record if the value has changed
                $hasChanged = true;
                if ($existingTracking) {
                    $hasChanged = $existingTracking->value !== $value;
                }
                
                if ($hasChanged) {
                    // Create new record to track the change
                    ImplementationTracking::create([
                        'implementation_area_id' => $implementationId,
                        'user_id' => $userId,
                        'key' => $field,
                        'value' => $value
                    ]);
                }
            }
        }
    }

    public function show($id)
    {
        try {
            $implementation = Implementation::findOrFail($id);
            
            // Get tracking data for specific fields with validation
            $desiredKeys = ['category', 'status', 'Date', 'progress', 'notes', 'assigned_to'];
            $trackingData = ImplementationTracking::where('implementation_area_id', $implementation->id)
                ->whereIn('key', $desiredKeys)
                ->get()
                ->keyBy('key')
                ->toArray();
                
            $implementation->tracking = $trackingData;

            // Get all tracking history with user information and pagination
            $trackings = ImplementationTracking::with('user')
                ->where('implementation_area_id', $id)
                ->orderBy('created_at', 'desc')
                ->paginate(50);
                
            // Get implementation history from audit table
            $implementationHistory = DB::table('implementation_audit_log')
                ->where('implementation_id', $id)
                ->orderBy('created_at', 'desc')
                ->paginate(50);
            
            return Inertia::render('Implementation/Show', [
                'implementation' => $implementation,
                'trackings' => $trackings,
                'tracking' => $trackingData,
                'implementationHistory' => $implementationHistory
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error showing implementation: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error loading implementation details');
        }
    }

    public function save_item(Request $request)
    {
        try {
            DB::beginTransaction();
            
            // Validate tracking fields
            $validator = Validator::make($request->all(), [
                'id' => 'required|exists:implementations,id',
                'category' => 'nullable|string|max:100',
                'status' => 'nullable|string|in:not_started,in_progress,completed,blocked',
                'Date' => 'nullable|date',
                'progress' => 'nullable|integer|min:0|max:100',
                'notes' => 'nullable|string',
                'assigned_to' => 'nullable|exists:users,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $implementation = Implementation::findOrFail($request->id);
            $userId = auth()->id();
            
            // Track changes for each field
            foreach ($request->all() as $key => $value) {
                if (in_array($key, ['id', '_token'])) continue;
                
                // Get existing tracking record with lock
                $existingTracking = ImplementationTracking::where('implementation_area_id', $implementation->id)
                    ->where('key', $key)
                    ->lockForUpdate()
                    ->latest()
                    ->first();
                
                // Only create new tracking record if value changed
                if (!$existingTracking || $existingTracking->value != $value) {
                    ImplementationTracking::create([
                        'implementation_area_id' => $implementation->id,
                        'key' => $key,
                        'value' => $value,
                        'user_id' => $userId,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    // Log to audit table
                    DB::table('implementation_audit_log')->insert([
                        'implementation_id' => $implementation->id,
                        'field_name' => $key,
                        'old_value' => $existingTracking ? $existingTracking->value : null,
                        'new_value' => $value,
                        'user_id' => $userId,
                        'created_at' => now()
                    ]);
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Implementation tracking updated successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error saving implementation tracking: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error saving implementation tracking'
            ], 500);
        }
    }

    public function save_artifacts(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'artifacts.*' => 'required|file|max:10240', // 10MB max
            'implementation_id' => 'required|exists:implementations,id',
            'field_name' => 'required|string'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $paths_array = [];
        if ($request->hasFile('artifacts')) {
            $files = $request->file('artifacts');
            foreach ($files as $file) {
                $name = now()->timestamp . "_{$file->getClientOriginalName()}";
                $path = $file->storeAs('artifacts', $name, 'public');
                $paths_array[] = "/storage/{$path}";
            }
        }
        if (count($paths_array) > 0) {
            $tracking = ImplementationTracking::create([
                'implementation_area_id' => $request->implementation_id,
                'user_id' => Auth::id(),
                'key' => $request->field_name,
                'value' => json_encode($paths_array),
            ]);
        }
        return to_route('implementation.field.name.index');
    }

    public function import_from_csv(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'import_file' => 'required|file|mimes:csv,txt',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => array('message' => $validator->errors()->first())], 500);
        }
        $file = $request->file('import_file');
        $filePath = $file->storeAs('import', now()->timestamp . "_{$file->getClientOriginalName()}");
        $csv = Reader::createFromPath(storage_path('app/' . $filePath), 'r');
        $csv->setHeaderOffset(0);
        $header = $csv->getHeader();
        return response()->json([
            'filePath' => $filePath,
            'header' => $header
        ], 200);
    }

    public function map_and_save_csv(Request $request)
    {
        // Validate required mappings to ensure we have at least the critical fields
        $validator = Validator::make($request->all(), [
            'file_path' => 'required|string',
            'mappings' => 'required|array',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['error' => ['message' => $validator->errors()->first()]], 422);
        }
        
        $filePath = $request->input('file_path');
        $mappings = $request->input('mappings');
        
        // Make sure required fields are mapped
        $requiredFields = ['siteName'];
        foreach ($requiredFields as $field) {
            if (!in_array($field, array_values($mappings))) {
                return response()->json([
                    'error' => ['message' => "The {$field} field must be mapped to a CSV column"]
                ], 422);
            }
        }
        
        try {
            // Process the CSV file
            $csv = Reader::createFromPath(storage_path('app/' . $filePath), 'r');
            $csv->setHeaderOffset(0);
            $records = $csv->getRecords();
            
            // Convert to array and chunk for batch processing
            $dataFromCsv = iterator_to_array($records);
            $dataChunks = array_chunk($dataFromCsv, 100);
            
            // Create a batch job to process the imports
            $batch = Bus::batch([])->dispatch();
            
            foreach ($dataChunks as $chunk) {
                $batch->add(new ProcessImplementationFieldImport($mappings, $chunk));
            }
            
            // Store batch ID in session for tracking
            session()->put('batch_implementation_id', $batch->id);
            
            // Trigger queue worker
            try {
                Artisan::call('queue:work', ['--once' => true]);
                Log::info('Queue work command executed successfully for Implementation import');
            } catch (\Exception $e) {
                Log::error('Error running queue work command for Implementation import: ' . $e->getMessage());
            }
            
            return response()->json([
                'success' => ['message' => 'Implementation data import started successfully.'],
                'batch_id' => $batch->id,
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('CSV import error: ' . $e->getMessage());
            return response()->json([
                'error' => ['message' => 'Error processing CSV file: ' . $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Export Implementation Tracker data in various formats
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
     */
    public function export(Request $request)
    {
        try {
            $format = $request->query('format', 'xlsx');
            $implementationData = Implementation::with(['timeline', 'history'])->get();

            switch ($format) {
                case 'xlsx':
                    return $this->exportToExcel($implementationData);
                case 'csv':
                    return $this->exportToCsv($implementationData);
                case 'pdf':
                    return $this->exportToPdf($implementationData);
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Unsupported export format'
                    ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Export error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export data to Excel format
     */
    private function exportToExcel($implementationData)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        
        // First worksheet for Implementation data
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Implementation Data');
        
        // Set headers
        $headers = [
            'ID', 'Site Name', 'Project Name', 'Status', 'Priority',
            'Start Date', 'End Date', 'Progress', 'Assigned To',
            'Dependencies', 'Notes', 'Created At', 'Updated At'
        ];
        $sheet->fromArray([$headers], NULL, 'A1');
        
        // Add data
        $row = 2;
        foreach ($implementationData as $implementation) {
            $sheet->fromArray([[
                $implementation->id,
                $implementation->site_name,
                $implementation->project_name,
                $implementation->status,
                $implementation->priority,
                $implementation->start_date,
                $implementation->end_date,
                $implementation->progress,
                $implementation->assigned_to,
                $implementation->dependencies,
                $implementation->notes,
                $implementation->created_at,
                $implementation->updated_at
            ]], NULL, "A{$row}");
            $row++;
        }
        
        // Auto-size columns for all sheets
        foreach (range('A', 'M') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        
        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $filename = 'implementation_export_' . date('Y-m-d_His') . '.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'implementation_');
        $writer->save($tempFile);
        
        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Export data to CSV format
     */
    private function exportToCsv($implementationData)
    {
        $filename = 'implementation_export_' . date('Y-m-d_His') . '.csv';
        $tempFile = tempnam(sys_get_temp_dir(), 'implementation_');
        
        $file = fopen($tempFile, 'w');
        fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
        
        // Write Implementation data
        $headers = [
            'ID', 'Site Name', 'Project Name', 'Status', 'Priority',
            'Start Date', 'End Date', 'Progress', 'Assigned To',
            'Dependencies', 'Notes', 'Created At', 'Updated At'
        ];
        fputcsv($file, $headers);
        
        foreach ($implementationData as $implementation) {
            fputcsv($file, [
                $implementation->id,
                $implementation->site_name,
                $implementation->project_name,
                $implementation->status,
                $implementation->priority,
                $implementation->start_date,
                $implementation->end_date,
                $implementation->progress,
                $implementation->assigned_to,
                $implementation->dependencies,
                $implementation->notes,
                $implementation->created_at,
                $implementation->updated_at
            ]);
        }
        
        fclose($file);
        
        return response()->download($tempFile, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ])->deleteFileAfterSend(true);
    }

    /**
     * Export data to PDF format
     */
    private function exportToPdf($implementationData)
    {
        $data = [
            'implementationData' => $implementationData,
            'exportDate' => now()->format('Y-m-d H:i:s')
        ];
        
        $pdf = \PDF::loadView('exports.implementation', $data);
        $filename = 'implementation_export_' . date('Y-m-d_His') . '.pdf';
        $tempFile = tempnam(sys_get_temp_dir(), 'implementation_');
        $pdf->save($tempFile);
        
        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ])->deleteFileAfterSend(true);
    }

    public function destroy($id)
    {
        $location = Implementation::findOrFail($id);
        $location->delete();
    }

    public function add_row(Request $request)
    {
        $item = $request->newItem;

        $implementation = Implementation::create([
            'category' => $item['category'] ? $item['category'] : '',
            'siteName' => $item['siteName'] ? $item['siteName'] : '',
            'eNB_gNB' => $item['eNB_gNB'] ? $item['eNB_gNB'] : '',
            'implementor' => $item['implementor'] ? $item['implementor'] : '',
            'comments' => $item['comments'] ? $item['comments'] : '',
            'enm_scripts_path' => $item['enm_scripts_path'] ? $item['enm_scripts_path'] : '',
            'sp_scripts_path' => $item['sp_scripts_path'] ? $item['sp_scripts_path'] : '',
            'CRQ' => $item['CRQ'] ? $item['CRQ'] : '',
        ]);
        
        // Save tracking fields
        $this->saveTrackingFields($implementation->id, $item);
        
        return response()->json(['success' => ['message' => 'Success Create New Item'], 'data' => $implementation]);
    }

    /**
     * Generate and download a template file for implementation imports
     * 
     * @param string $targetTable Table name to generate template for
     * @param string $format Format of the template file (csv or excel)
     * @return \Illuminate\Http\Response
     */
    public function downloadTemplate($targetTable, $format)
    {
        try {
            // Validate parameters
            if ($targetTable !== 'implementation') {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid table specified'
                ], 400);
            }
            
            if (!in_array($format, ['excel', 'csv'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid format specified'
                ], 400);
            }
            
            // Create a spreadsheet
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Get the header columns
            $headers = $this->getTemplateHeaders();
            
            // Set headers in the first row
            $columnIndex = 1;
            foreach ($headers as $header) {
                $sheet->setCellValueByColumnAndRow($columnIndex++, 1, $header);
            }
            
            // Add some sample data in the second row
            $sampleData = [
                'Project X', 'IMP001', 'Site A', 'New Installation', 
                'Phase 1', 'In Progress', 'High', 'Team Alpha',
                '2023-01-01', '2023-03-31', '80', 
                'Network optimization pending', 'Power issue resolved'
            ];
            
            // Add sample data row
            $columnIndex = 1;
            foreach ($sampleData as $value) {
                $sheet->setCellValueByColumnAndRow($columnIndex++, 2, $value);
            }
            
            // Style the header row
            $headerRange = 'A1:' . \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers)) . '1';
            $sheet->getStyle($headerRange)->getFont()->setBold(true);
            $sheet->getStyle($headerRange)->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D3D3D3');
                
            // Auto-size columns for better readability
            foreach (range(1, count($headers)) as $col) {
                $sheet->getColumnDimensionByColumn($col)->setAutoSize(true);
            }
            
            // Also add any additional columns
            $additionalColumns = AdditionalColumn::where('type', 'implementation')->get();
            if ($additionalColumns->count() > 0) {
                $row = 1;
                $startCol = count($headers) + 1;
                
                // Add header for additional columns
                foreach ($additionalColumns as $index => $column) {
                    $colIndex = $startCol + $index;
                    $sheet->setCellValueByColumnAndRow($colIndex, $row, strtoupper($column->name));
                    $sheet->getStyleByColumnAndRow($colIndex, $row)->getFont()->setBold(true);
                    $sheet->getStyleByColumnAndRow($colIndex, $row)->getFill()
                        ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('D3D3D3');
                    $sheet->getColumnDimensionByColumn($colIndex)->setAutoSize(true);
                }
                
                // Add example values for additional columns
                $row = 2;
                foreach ($additionalColumns as $index => $column) {
                    $colIndex = $startCol + $index;
                    $sheet->setCellValueByColumnAndRow($colIndex, $row, "Example " . $column->name);
                }
            }
            
            // Create the writer based on format
            if ($format === 'csv') {
                $writer = new Csv($spreadsheet);
                $contentType = 'text/csv';
                $extension = 'csv';
                
                // Set CSV specific options
                $writer->setDelimiter(',');
                $writer->setEnclosure('"');
                $writer->setLineEnding("\r\n");
                $writer->setSheetIndex(0);
                $writer->setUseBOM(true); // Add BOM for Excel compatibility
            } else {
                $writer = new Xlsx($spreadsheet);
                $contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                $extension = 'xlsx';
            }
            
            // Prepare response
            $filename = "implementation_template." . $extension;
            
            // Create a temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'template_');
            $writer->save($tempFile);
            
            // Return the file
            return response()->file($tempFile, [
                'Content-Type' => $contentType,
                'Content-Disposition' => "attachment; filename={$filename}"
            ])->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error("Error generating template: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error generating template: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get template headers for implementation
     * 
     * @return array
     */
    private function getTemplateHeaders()
    {
        return [
            'Project Name', 
            'Implementation ID', 
            'Site',
            'Type',
            'Phase',
            'Status',
            'Priority',
            'Assigned Team',
            'Start Date',
            'End Date',
            'Completion Percentage',
            'Notes',
            'Issues'
        ];
    }

    /**
     * Import Implementation data from file
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls,csv,txt',
                'columnMappings' => 'required|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $columnMappings = $request->input('columnMappings');
            
            // Store the file
            $filePath = $file->store('temp');
            
            // Use the import service
            $importService = app(ImplementationImportService::class);
            $result = $importService->importFromFile($filePath, $columnMappings);
            
            return response()->json($result);
            
        } catch (\Exception $e) {
            Log::error('Implementation import error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error importing data: ' . $e->getMessage()
            ], 500);
        }
    }
}
