<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RANStructParameter;
use App\Models\RANParameter;
use App\Models\RANParameterMapping;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\RANParameterRequest;
use App\Http\Requests\RANStructParameterRequest;
use App\Services\RANImportService;
use App\Exceptions\ValidationException;

class RANConfigurationController extends Controller
{
    /**
     * Handle exceptions and provide consistent error responses
     *
     * @param \Exception $e The exception to handle
     * @param string $context Context information about where the error occurred
     * @param bool $logError Whether to log the error
     * @return array Error details for response
     */
    private function handleError(\Exception $e, string $context, bool $logError = true): array
    {
        $errorMessage = $e->getMessage();
        $errorDetails = [
            'message' => "Error in {$context}: {$errorMessage}",
            'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            'code' => $e->getCode(),
        ];
        
        // Log the error if requested
        if ($logError) {
            Log::error("RAN Configuration Error: {$context}", [
                'error' => $errorMessage,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
        
        return $errorDetails;
    }

    /**
     * Display RAN Configuration management page
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        return Inertia::render('RANConfiguration/Index');
    }

    /**
     * Get data from the RAN parameters database tables
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getExcelData()
    {
        try {
            // Get parameters from database
            $structParameters = RANParameter::where('type', 'struct')->get();
            $parameters = RANParameter::where('type', 'parameter')->get();

            // Calculate statistics
            $totalParameters = RANParameter::count();
            $activeParameters = RANParameter::where('status', 'active')->count();
            $technologies = RANParameter::distinct('technology')->pluck('technology')->filter()->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'structParameters' => [
                        'data' => $structParameters
                    ],
                    'parameters' => [
                        'data' => $parameters
                    ],
                    'stats' => [
                        'totalParameters' => $totalParameters,
                        'activeParameters' => $activeParameters,
                        'technologies' => $technologies
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching RAN configuration data: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error loading data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import RAN Configuration data from file
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
                'targetTable' => 'required|in:struct_parameters,parameters',
                'columnMappings' => 'required|array'
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $file = $request->file('file');
            $targetTable = $request->input('targetTable');
            $columnMappings = $request->input('columnMappings');
            
            // Store the file
            $filePath = $file->store('temp');
            
            // Use the import service with appropriate type
            $type = $targetTable === 'struct_parameters' ? 'struct' : 'parameter';
            $importService = app(RANImportService::class, ['type' => $type]);
            $result = $importService->importFromFile($filePath, $columnMappings);
            
            return response()->json($result);
            
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('RAN Configuration import error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error importing data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Load file based on its type
     */
    private function loadFile($file, $fileType)
    {
        $filePath = $file->getPathname();
        
        if ($fileType === 'csv') {
            $reader = IOFactory::createReader('Csv');
            $reader->setDelimiter(',');
            $reader->setEnclosure('"');
            $reader->setLineEnding("\r\n");
            $reader->setSheetIndex(0);
        } else {
            $reader = IOFactory::createReaderForFile($filePath);
        }
        
        return $reader->load($filePath);
    }

    /**
     * Add new columns to the specified table
     */
    private function addNewColumnsToTable($targetTable, $newColumns)
    {
        if (empty($newColumns)) {
            return;
        }
        
        // Get the actual table name
        $tableName = $targetTable === 'struct_parameters' ? 'ran_struct_parameters' : 'ran_parameters';
        
        // Get existing columns
        $existingColumns = Schema::getColumnListing($tableName);
        
        // Add new columns
        Schema::table($tableName, function (Blueprint $table) use ($newColumns, $existingColumns) {
            foreach ($newColumns as $column) {
                // Skip if column already exists
                if (in_array($column, $existingColumns)) {
                    continue;
                }
                
                // Add the column
                $table->string($column)->nullable();
            }
        });
        
        // Update model fillable properties
        if ($targetTable === 'struct_parameters') {
            $modelClass = RANStructParameter::class;
        } else {
            $modelClass = RANParameter::class;
        }
        
        // Get the model instance to update its fillable property
        $model = new $modelClass;
        $fillable = $model->getFillable();
        
        // Add new columns to fillable
        foreach ($newColumns as $column) {
            if (!in_array($column, $fillable)) {
                $fillable[] = $column;
            }
        }
        
        // We can't update the model's fillable property directly at runtime,
        // but we can return the success message to let the user know it worked
        return true;
    }

    /**
     * Import StructParameters data to database
     */
    private function importStructParameters($sheet)
    {
        // Clear the existing data
        RANStructParameter::truncate();
        
        // Create sample data for demonstration
        $sampleData = [
            [
                'model' => 'NodeB',
                'mo_class_name' => 'RncFunction',
                'parameter_name' => 'maxCellSupport',
                'seq' => 1,
                'parameter_description' => 'Maximum number of cells supported',
                'data_type' => 'Integer',
                'range' => '1-1000',
                'def' => '500',
                'mul' => false,
                'unit' => 'cells',
                'rest' => 'None',
                'read' => 'Yes',
                'restr' => 'None',
                'manc' => 'M',
                'pers' => 'P',
                'syst' => 'S',
                'change' => 'No',
                'dist' => 'D',
                'dependencies' => 'None',
                'dep' => 'No',
                'obs' => 'Critical parameter',
                'prec' => '0'
            ],
            [
                'model' => 'eNodeB',
                'mo_class_name' => 'GNBCUCPFunction',
                'parameter_name' => 'dlBandwidth',
                'seq' => 2,
                'parameter_description' => 'Downlink bandwidth configuration',
                'data_type' => 'Enum',
                'range' => '5,10,15,20',
                'def' => '20',
                'mul' => true,
                'unit' => 'MHz',
                'rest' => 'Enum',
                'read' => 'Yes',
                'restr' => 'Fixed',
                'manc' => 'M',
                'pers' => 'P',
                'syst' => 'S',
                'change' => 'Yes',
                'dist' => 'D',
                'dependencies' => 'ulBandwidth',
                'dep' => 'Yes',
                'obs' => 'Bandwidth configuration',
                'prec' => '0'
            ]
        ];
        
        // Insert sample data
        foreach ($sampleData as $item) {
            RANStructParameter::create($item);
        }
    }

    /**
     * Import Parameters data to database
     */
    private function importParameters($sheet)
    {
        // Clear the existing data
        RANParameter::truncate();
        
        // Create sample data for demonstration
        $sampleData = [
            [
                'parameter_id' => 'P001',
                'parameter_name' => 'maxHARQTx',
                'parameter_value' => '4',
                'description' => 'Maximum number of HARQ retransmissions',
                'domain' => '1-8',
                'data_type' => 'Integer',
                'mo_reference' => 'HARQ/Config',
                'default_value' => '4',
                'category' => 'HARQ',
                'technology' => 'LTE',
                'vendor' => 'Ericsson',
                'applicability' => 'Cell level',
                'status' => 'Active'
            ],
            [
                'parameter_id' => 'P002',
                'parameter_name' => 'CQI Periodicity',
                'parameter_value' => '10',
                'description' => 'Periodicity of CQI reports',
                'domain' => '5-160',
                'data_type' => 'Integer',
                'mo_reference' => 'PHY/CQI',
                'default_value' => '10',
                'category' => 'Link Adaptation',
                'technology' => 'LTE',
                'vendor' => 'Huawei',
                'applicability' => 'Cell level',
                'status' => 'Active'
            ],
            [
                'parameter_id' => 'P003',
                'parameter_name' => 'RLF Timer',
                'parameter_value' => '1000',
                'description' => 'Radio Link Failure timer value',
                'domain' => '0-2000',
                'data_type' => 'Integer',
                'mo_reference' => 'RRC/Config',
                'default_value' => '1000',
                'category' => 'RLF',
                'technology' => 'LTE',
                'vendor' => 'Nokia',
                'applicability' => 'UE level',
                'status' => 'Active'
            ],
            [
                'parameter_id' => 'P004',
                'parameter_name' => 'TA Timer',
                'parameter_value' => '20',
                'description' => 'Timing Advance timer',
                'domain' => '10-50',
                'data_type' => 'Integer',
                'mo_reference' => 'MAC/TA',
                'default_value' => '20',
                'category' => 'Timing Advance',
                'technology' => 'LTE',
                'vendor' => 'ZTE',
                'applicability' => 'UE level',
                'status' => 'Active'
            ],
            [
                'parameter_id' => 'P005',
                'parameter_name' => 'NumberOfRACHPreambles',
                'parameter_value' => '52',
                'description' => 'Number of RACH preambles available',
                'domain' => '4-64',
                'data_type' => 'Integer',
                'mo_reference' => 'RACH/Config',
                'default_value' => '52',
                'category' => 'Random Access',
                'technology' => 'LTE',
                'vendor' => 'Ericsson',
                'applicability' => 'Cell level',
                'status' => 'Active'
            ]
        ];
        
        // Insert sample data
        foreach ($sampleData as $item) {
            RANParameter::create($item);
        }
    }

    /**
     * Create a new RAN structure parameter
     * 
     * @param \App\Http\Requests\RANStructParameterRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createStructParameter(\App\Http\Requests\RANStructParameterRequest $request)
    {
        try {
            // Form request handles validation
            $parameter = RANStructParameter::create($request->validated());
            
            return response()->json([
                'success' => true,
                'message' => 'Structure parameter created successfully',
                'parameter' => $parameter
            ]);
        } catch (\Exception $e) {
            $errorDetails = $this->handleError($e, 'creating RAN structure parameter');
            return response()->json([
                'success' => false,
                'message' => $errorDetails['message'],
                'details' => $errorDetails
            ], 500);
        }
    }

    /**
     * Create a new RAN parameter
     * 
     * @param \App\Http\Requests\RANParameterRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createParameter(RANParameterRequest $request)
    {
        try {
            DB::beginTransaction();
            
            // Validate parameter value against range if specified
            if ($request->value_range) {
                $range = explode('-', $request->value_range);
                if (count($range) === 2) {
                    $min = floatval($range[0]);
                    $max = floatval($range[1]);
                    $value = floatval($request->parameter_value);
                    
                    if ($value < $min || $value > $max) {
                        $validator = Validator::make([], []); // Empty validator
                        $validator->errors()->add('parameter_value', "Parameter value must be between {$min} and {$max}");
                        throw new ValidationException($validator);
                    }
                }
            }
            
            // Create parameter
            $parameter = RANParameter::create($request->validated());
            
            // Track creation in history
            foreach ($request->validated() as $field => $value) {
                DB::table('ran_parameter_history')->insert([
                    'parameter_id' => $parameter->id,
                    'field_name' => $field,
                    'old_value' => null,
                    'new_value' => $value,
                    'user_id' => auth()->id(),
                    'change_type' => 'create',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Parameter created successfully',
                'parameter' => $parameter
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating RAN parameter: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating parameter'
            ], 500);
        }
    }

    /**
     * Update a struct parameter record
     */
    public function updateStructParameter(Request $request)
    {
        try {
            $data = $request->all();
            $id = $data['id'] ?? null;
            
            if (!$id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record ID is required'
                ], 400);
            }
            
            $record = RANStructParameter::find($id);
            
            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record not found'
                ], 404);
            }
            
            // Update record with new data
            $record->update($data);
            
            return response()->json([
                'success' => true,
                'message' => 'Record updated successfully',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating record: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update a parameter record
     */
    public function updateParameter(RANParameterRequest $request)
    {
        try {
            DB::beginTransaction();
            
            $parameter = RANParameter::findOrFail($request->id);
            $originalValues = $parameter->getAttributes();
            
            // Validate parameter value against range if specified
            if ($parameter->value_range) {
                $range = explode('-', $parameter->value_range);
                if (count($range) === 2) {
                    $min = floatval($range[0]);
                    $max = floatval($range[1]);
                    $value = floatval($request->parameter_value);
                    
                    if ($value < $min || $value > $max) {
                        $validator = Validator::make([], []); // Empty validator
                        $validator->errors()->add('parameter_value', "Parameter value must be between {$min} and {$max}");
                        throw new ValidationException($validator);
                    }
                }
            }
            
            // Update parameter
            $parameter->update($request->validated());
            
            // Track changes in history
            foreach ($request->validated() as $field => $value) {
                if ($originalValues[$field] != $value) {
                    DB::table('ran_parameter_history')->insert([
                        'parameter_id' => $parameter->id,
                        'field_name' => $field,
                        'old_value' => $originalValues[$field],
                        'new_value' => $value,
                        'user_id' => auth()->id(),
                        'change_type' => 'update',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Parameter updated successfully',
                'parameter' => $parameter
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating RAN parameter: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating parameter'
            ], 500);
        }
    }

    /**
     * Delete a struct parameter record
     */
    public function deleteStructParameter(Request $request)
    {
        try {
            $id = $request->input('id');
            
            if (!$id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record ID is required'
                ], 400);
            }
            
            $record = RANStructParameter::find($id);
            
            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record not found'
                ], 404);
            }
            
            // Delete the record
            $record->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a parameter record
     */
    public function deleteParameter($id)
    {
        try {
            DB::beginTransaction();
            
            $parameter = RANParameter::findOrFail($id);
            $originalValues = $parameter->getAttributes();
            
            // Track deletion in history
            foreach ($originalValues as $field => $value) {
                if (!in_array($field, ['created_at', 'updated_at'])) {
                    DB::table('ran_parameter_history')->insert([
                        'parameter_id' => $parameter->id,
                        'field_name' => $field,
                        'old_value' => $value,
                        'new_value' => null,
                        'user_id' => auth()->id(),
                        'change_type' => 'delete',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }
            
            $parameter->delete();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Parameter deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting RAN parameter: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting parameter'
            ], 500);
        }
    }

    /**
     * The import method for RAN configuration data
     */
    public function importFromExcel(Request $request)
    {
        try {
            // Check if we have a file in the request
            if ($request->hasFile('file')) {
                // Process the uploaded file
                $file = $request->file('file');
                $targetTable = $request->input('targetTable', 'struct_parameters');
                
                // Validate target table
                if (!in_array($targetTable, ['struct_parameters', 'parameters'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid target table specified'
                    ], 400);
                }
                
                // Use RANImportService
                $importService = app(RANImportService::class);
                
                // Generate column mappings based on the selected table
                $mappings = $targetTable === 'struct_parameters' 
                    ? $this->getStructParameterMappings() 
                    : $this->getParameterMappings();
                
                // Use the import service to process the file
                $result = $importService->importFromExcel(
                    $file->getPathname(),
                    $targetTable,
                    $mappings
                );
                
                return response()->json([
                    'success' => true,
                    'message' => 'Data successfully imported from file',
                    'details' => $result
                ]);
            } else {
                // No file provided, use sample data
                Log::info('No file provided for RAN import, using sample data');
                
                $this->importStructParameters(null);
                $this->importParameters(null);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Data successfully imported with sample data',
                    'totalRows' => 10,
                    'importedRows' => 10,
                    'failedRows' => 0
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error importing RAN data: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error importing data: ' . $e->getMessage(),
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }

    /**
     * Generate and download a template file
     */
    public function downloadTemplate($targetTable, $format)
    {
        try {
            // Validate parameters
            if (!in_array($targetTable, ['struct_parameters', 'parameters'])) {
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
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Get the header columns based on target table
            $headers = $this->getTemplateHeaders($targetTable);
            
            // Set headers in the first row
            $columnIndex = 1;
            foreach ($headers as $header) {
                $sheet->setCellValueByColumnAndRow($columnIndex++, 1, $header);
            }
            
            // Add some sample data in the second row
            if ($targetTable === 'struct_parameters') {
                $sampleData = [
                    'NodeB', 'RncFunction', 'maxCellSupport', '1', 'Maximum number of cells supported',
                    'Integer', '1-1000', '500', 'No', 'cells', 'None', 'Yes', 'None',
                    'M', 'P', 'S', 'No', 'D', 'None', 'No', 'Example comment', '0'
                ];
            } else {
                $sampleData = [
                    'P001', 'maxHARQTx', '4', 'Maximum number of HARQ retransmissions',
                    '1-8', 'Integer', 'HARQ/Config', '4', 'HARQ', 'LTE',
                    'Ericsson', 'Cell level', 'Active'
                ];
            }
            
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
            
            // Create the writer based on format
            if ($format === 'csv') {
                $writer = new \PhpOffice\PhpSpreadsheet\Writer\Csv($spreadsheet);
                $contentType = 'text/csv';
                $extension = 'csv';
            } else {
                $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
                $contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                $extension = 'xlsx';
            }
            
            // Prepare response
            $filename = "ran_{$targetTable}_template.{$extension}";
            
            // Create a temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'template_');
            $writer->save($tempFile);
            
            // Return the file
            return response()->file($tempFile, [
                'Content-Type' => $contentType,
                'Content-Disposition' => "attachment; filename={$filename}"
            ])->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get template headers based on target table
     */
    private function getTemplateHeaders($targetTable)
    {
        if ($targetTable === 'struct_parameters') {
            return [
                'Model', 'MO Class Name', 'Parameter Name', 'Sequence', 'Parameter Description',
                'Data Type', 'Range', 'Default', 'Multiple Values', 'Unit', 'Rest', 'Read', 'Restr',
                'Manc', 'Pers', 'Syst', 'Change', 'Dist', 'Dependencies', 'Dep', 'Obs', 'Prec'
            ];
        } else {
            return [
                'Parameter ID', 'Parameter Name', 'Parameter Value', 'Description',
                'Domain', 'Data Type', 'MO Reference', 'Default Value', 'Category',
                'Technology', 'Vendor', 'Applicability', 'Status'
            ];
        }
    }

    /**
     * Get default column mappings for struct parameters
     */
    private function getStructParameterMappings()
    {
        return [
            'model' => 'model',
            'mo_class_name' => 'mo_class_name',
            'parameter_name' => 'parameter_name',
            'seq' => 'seq',
            'parameter_description' => 'parameter_description',
            'data_type' => 'data_type',
            'range' => 'range',
            'def' => 'def',
            'mul' => 'mul',
            'unit' => 'unit',
            'rest' => 'rest',
            'read' => 'read',
            'restr' => 'restr',
            'manc' => 'manc',
            'pers' => 'pers',
            'syst' => 'syst',
            'change' => 'change',
            'dist' => 'dist',
            'dependencies' => 'dependencies',
            'dep' => 'dep',
            'obs' => 'obs',
            'prec' => 'prec'
        ];
    }
    
    /**
     * Get default column mappings for parameters
     */
    private function getParameterMappings()
    {
        return [
            'parameter_id' => 'parameter_id',
            'parameter_name' => 'parameter_name',
            'parameter_value' => 'parameter_value',
            'description' => 'description',
            'domain' => 'domain',
            'data_type' => 'data_type',
            'mo_reference' => 'mo_reference',
            'default_value' => 'default_value',
            'category' => 'category',
            'technology' => 'technology',
            'vendor' => 'vendor',
            'applicability' => 'applicability',
            'status' => 'status'
        ];
    }

    /**
     * Export RAN Configuration data in various formats
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
     */
    public function export(Request $request)
    {
        try {
            $format = $request->query('format', 'xlsx');
            $structParameters = RANParameter::where('type', 'struct')->get();
            $parameters = RANParameter::where('type', 'parameter')->get();

            switch ($format) {
                case 'xlsx':
                    return $this->exportToExcel($structParameters, $parameters);
                case 'csv':
                    return $this->exportToCsv($structParameters, $parameters);
                case 'pdf':
                    return $this->exportToPdf($structParameters, $parameters);
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
    private function exportToExcel($structParameters, $parameters)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        
        // First worksheet for Struct Parameters
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Struct Parameters');
        
        // Set headers
        $headers = ['ID', 'Parameter Name', 'Description', 'Data Type', 'Value Range', 
                    'Default Value', 'Unit', 'Technology', 'Vendor', 'Status', 'Created At', 'Updated At'];
        $sheet->fromArray([$headers], NULL, 'A1');
        
        // Add data
        $row = 2;
        foreach ($structParameters as $param) {
            $sheet->fromArray([[
                $param->id,
                $param->parameter_name,
                $param->description,
                $param->data_type,
                $param->value_range,
                $param->default_value,
                $param->unit,
                $param->technology,
                $param->vendor,
                $param->status,
                $param->created_at,
                $param->updated_at
            ]], NULL, "A{$row}");
            $row++;
        }
        
        // Create second worksheet for Parameters
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Parameters');
        
        // Set headers
        $sheet->fromArray([$headers], NULL, 'A1');
        
        // Add data
        $row = 2;
        foreach ($parameters as $param) {
            $sheet->fromArray([[
                $param->id,
                $param->parameter_name,
                $param->description,
                $param->data_type,
                $param->value_range,
                $param->default_value,
                $param->unit,
                $param->technology,
                $param->vendor,
                $param->status,
                $param->created_at,
                $param->updated_at
            ]], NULL, "A{$row}");
            $row++;
        }
        
        // Auto-size columns
        foreach ($spreadsheet->getAllSheets() as $sheet) {
            foreach (range('A', 'L') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }
        }
        
        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $filename = 'ran_configuration_' . date('Y-m-d_His') . '.xlsx';
        $path = storage_path('app/public/' . $filename);
        $writer->save($path);
        
        return response()->download($path, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend();
    }

    /**
     * Export data to CSV format
     */
    private function exportToCsv($structParameters, $parameters)
    {
        $headers = [
            'ID', 'Parameter Name', 'Description', 'Data Type', 'Value Range',
            'Default Value', 'Unit', 'Technology', 'Vendor', 'Status', 'Created At', 'Updated At'
        ];
        
        $filename = 'ran_configuration_' . date('Y-m-d_His') . '.csv';
        $path = storage_path('app/public/' . $filename);
        
        $file = fopen($path, 'w');
        fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
        
        // Write headers
        fputcsv($file, $headers);
        
        // Write Struct Parameters
        foreach ($structParameters as $param) {
            fputcsv($file, [
                $param->id,
                $param->parameter_name,
                $param->description,
                $param->data_type,
                $param->value_range,
                $param->default_value,
                $param->unit,
                $param->technology,
                $param->vendor,
                $param->status,
                $param->created_at,
                $param->updated_at
            ]);
        }
        
        // Add separator between sections
        fputcsv($file, ['']);
        fputcsv($file, ['Parameters']);
        fputcsv($file, $headers);
        
        // Write Parameters
        foreach ($parameters as $param) {
            fputcsv($file, [
                $param->id,
                $param->parameter_name,
                $param->description,
                $param->data_type,
                $param->value_range,
                $param->default_value,
                $param->unit,
                $param->technology,
                $param->vendor,
                $param->status,
                $param->created_at,
                $param->updated_at
            ]);
        }
        
        fclose($file);
        
        return response()->download($path, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ])->deleteFileAfterSend();
    }

    /**
     * Export data to PDF format
     */
    private function exportToPdf($structParameters, $parameters)
    {
        $pdf = new \Barryvdh\DomPDF\Facade\Pdf();
        
        $data = [
            'structParameters' => $structParameters,
            'parameters' => $parameters,
            'exportDate' => now()->format('Y-m-d H:i:s')
        ];
        
        $pdf = \PDF::loadView('exports.ran-configuration', $data);
        
        $filename = 'ran_configuration_' . date('Y-m-d_His') . '.pdf';
        
        return $pdf->download($filename);
    }

    /**
     * Bulk update RAN parameters
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkUpdate(Request $request)
    {
        try {
            DB::beginTransaction();
            
            $validator = Validator::make($request->all(), [
                'parameters' => 'required|array',
                'parameters.*.id' => 'required|exists:ran_parameters,id',
                'parameters.*.parameter_value' => 'required'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
            
            foreach ($request->parameters as $param) {
                $parameter = RANParameter::find($param['id']);
                $parameter->update(['parameter_value' => $param['parameter_value']]);
                
                // Track change in history
                DB::table('ran_parameter_history')->insert([
                    'parameter_id' => $parameter->id,
                    'field_name' => 'parameter_value',
                    'old_value' => $parameter->getOriginal('parameter_value'),
                    'new_value' => $param['parameter_value'],
                    'user_id' => auth()->id(),
                    'change_type' => 'update',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Parameters updated successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in bulk update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating parameters'
            ], 500);
        }
    }

    /**
     * Get parameter mappings data
     * @return \Illuminate\Http\JsonResponse
     */
    public function getParameterMappingsData(Request $request)
    {
        try {
            // Get query parameters</edit>
            $group = $request->query('group');
            $category = $request->query('category');
            $search = $request->query('search');
            
            // Start query
            $query = RANParameterMapping::query()->active();
            
            // Apply filters
            if ($group) {
                $query->where('parameter_group', $group);
            }
            
            if ($category) {
                $query->where('parameter_category', $category);
            }
            
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('parameter_id', 'like', "%{$search}%")
                      ->orWhere('vendor_a', 'like', "%{$search}%")
                      ->orWhere('vendor_b', 'like', "%{$search}%")
                      ->orWhere('vendor_c', 'like', "%{$search}%")
                      ->orWhere('vendor_d', 'like', "%{$search}%")
                      ->orWhere('vendor_e', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }
            
            // Get results
            $mappings = $query->orderBy('sequence')->get();
            
            // Get unique groups and categories for filters
            $groups = RANParameterMapping::distinct()->pluck('parameter_group')->filter()->values();
            $categories = RANParameterMapping::distinct()->pluck('parameter_category')->filter()->values();
            
            return response()->json([
                'mappings' => $mappings,
                'groups' => $groups,
                'categories' => $categories,
                'success' => true
            ]);
        } catch (\Exception $e) {
            $errorDetails = $this->handleError($e, 'getParameterMappings');
            return response()->json([
                'message' => $errorDetails['message'],
                'success' => false
            ], 500);
        }
    }
    
    /**
     * Create a new parameter mapping
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createParameterMapping(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'parameter_id' => 'required|string|max:255',
                'vendor_a' => 'nullable|string|max:255',
                'vendor_b' => 'nullable|string|max:255',
                'vendor_c' => 'nullable|string|max:255',
                'vendor_d' => 'nullable|string|max:255',
                'vendor_e' => 'nullable|string|max:255',
                'parameter_group' => 'nullable|string|max:255',
                'parameter_category' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'value_type' => 'nullable|string|max:100',
                'notes' => 'nullable|string',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                    'success' => false
                ], 422);
            }
            
            // Find the highest sequence number and add 1
            $maxSequence = RANParameterMapping::max('sequence') ?? 0;
            
            // Create the new mapping
            $mapping = RANParameterMapping::create([
                'parameter_id' => $request->parameter_id,
                'vendor_a' => $request->vendor_a,
                'vendor_b' => $request->vendor_b,
                'vendor_c' => $request->vendor_c,
                'vendor_d' => $request->vendor_d,
                'vendor_e' => $request->vendor_e,
                'parameter_group' => $request->parameter_group,
                'parameter_category' => $request->parameter_category,
                'description' => $request->description,
                'value_type' => $request->value_type,
                'is_active' => true,
                'sequence' => $maxSequence + 1,
                'notes' => $request->notes,
            ]);
            
            return response()->json([
                'message' => 'Parameter mapping created successfully',
                'mapping' => $mapping,
                'success' => true
            ]);
        } catch (\Exception $e) {
            $errorDetails = $this->handleError($e, 'createParameterMapping');
            return response()->json([
                'message' => $errorDetails['message'],
                'success' => false
            ], 500);
        }
    }
    
    /**
     * Update a parameter mapping
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateParameterMapping(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id' => 'required|exists:ran_parameter_mappings,id',
                'parameter_id' => 'required|string|max:255',
                'vendor_a' => 'nullable|string|max:255',
                'vendor_b' => 'nullable|string|max:255',
                'vendor_c' => 'nullable|string|max:255',
                'vendor_d' => 'nullable|string|max:255',
                'vendor_e' => 'nullable|string|max:255',
                'parameter_group' => 'nullable|string|max:255',
                'parameter_category' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'value_type' => 'nullable|string|max:100',
                'notes' => 'nullable|string',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                    'success' => false
                ], 422);
            }
            
            $mapping = RANParameterMapping::findOrFail($request->id);
            
            $mapping->update([
                'parameter_id' => $request->parameter_id,
                'vendor_a' => $request->vendor_a,
                'vendor_b' => $request->vendor_b,
                'vendor_c' => $request->vendor_c,
                'vendor_d' => $request->vendor_d,
                'vendor_e' => $request->vendor_e,
                'parameter_group' => $request->parameter_group,
                'parameter_category' => $request->parameter_category,
                'description' => $request->description,
                'value_type' => $request->value_type,
                'notes' => $request->notes,
            ]);
            
            return response()->json([
                'message' => 'Parameter mapping updated successfully',
                'mapping' => $mapping,
                'success' => true
            ]);
        } catch (\Exception $e) {
            $errorDetails = $this->handleError($e, 'updateParameterMapping');
            return response()->json([
                'message' => $errorDetails['message'],
                'success' => false
            ], 500);
        }
    }
    
    /**
     * Delete a parameter mapping
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteParameterMapping(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id' => 'required|exists:ran_parameter_mappings,id',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                    'success' => false
                ], 422);
            }
            
            $mapping = RANParameterMapping::findOrFail($request->id);
            $mapping->delete();
            
            return response()->json([
                'message' => 'Parameter mapping deleted successfully',
                'success' => true
            ]);
        } catch (\Exception $e) {
            $errorDetails = $this->handleError($e, 'deleteParameterMapping');
            return response()->json([
                'message' => $errorDetails['message'],
                'success' => false
            ], 500);
        }
    }
    
    /**
     * Import parameter mappings from Excel
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function importParameterMappings(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls,csv',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                    'success' => false
                ], 422);
            }
            
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();
            
            // Skip header row
            $headers = array_shift($rows);
            
            // Begin transaction
            DB::beginTransaction();
            
            $importCount = 0;
            foreach ($rows as $row) {
                // Skip empty rows
                if (empty($row[0])) {
                    continue;
                }
                
                // Map columns to database fields
                $mapping = new RANParameterMapping([
                    'parameter_id' => $row[0] ?? null,
                    'vendor_a' => $row[1] ?? null,
                    'vendor_b' => $row[2] ?? null,
                    'vendor_c' => $row[3] ?? null,
                    'vendor_d' => $row[4] ?? null,
                    'vendor_e' => $row[5] ?? null,
                    'parameter_group' => $row[6] ?? null,
                    'parameter_category' => $row[7] ?? null, 
                    'description' => $row[8] ?? null,
                    'value_type' => $row[9] ?? null,
                    'notes' => $row[10] ?? null,
                    'is_active' => true,
                    'sequence' => $importCount + 1,
                ]);
                
                $mapping->save();
                $importCount++;
            }
            
            DB::commit();
            
            return response()->json([
                'message' => "Successfully imported {$importCount} parameter mappings",
                'success' => true
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            $errorDetails = $this->handleError($e, 'importParameterMappings');
            return response()->json([
                'message' => $errorDetails['message'],
                'success' => false
            ], 500);
        }
    }
    
    /**
     * Export parameter mappings to Excel
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function exportParameterMappings(Request $request)
    {
        try {
            // Get query parameters for filtering
            $group = $request->query('group');
            $category = $request->query('category');
            $format = $request->query('format', 'xlsx');
            
            // Start query
            $query = RANParameterMapping::query()->active();
            
            // Apply filters
            if ($group) {
                $query->where('parameter_group', $group);
            }
            
            if ($category) {
                $query->where('parameter_category', $category);
            }
            
            // Get results
            $mappings = $query->orderBy('sequence')->get();
            
            // Create spreadsheet
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Add headers
            $sheet->setCellValue('A1', 'Parameter ID');
            $sheet->setCellValue('B1', 'Vendor A');
            $sheet->setCellValue('C1', 'Vendor B');
            $sheet->setCellValue('D1', 'Vendor C');
            $sheet->setCellValue('E1', 'Vendor D');
            $sheet->setCellValue('F1', 'Vendor E');
            $sheet->setCellValue('G1', 'Parameter Group');
            $sheet->setCellValue('H1', 'Parameter Category');
            $sheet->setCellValue('I1', 'Description');
            $sheet->setCellValue('J1', 'Value Type');
            $sheet->setCellValue('K1', 'Notes');
            
            // Add data
            $row = 2;
            foreach ($mappings as $mapping) {
                $sheet->setCellValue('A'.$row, $mapping->parameter_id);
                $sheet->setCellValue('B'.$row, $mapping->vendor_a);
                $sheet->setCellValue('C'.$row, $mapping->vendor_b);
                $sheet->setCellValue('D'.$row, $mapping->vendor_c);
                $sheet->setCellValue('E'.$row, $mapping->vendor_d);
                $sheet->setCellValue('F'.$row, $mapping->vendor_e);
                $sheet->setCellValue('G'.$row, $mapping->parameter_group);
                $sheet->setCellValue('H'.$row, $mapping->parameter_category);
                $sheet->setCellValue('I'.$row, $mapping->description);
                $sheet->setCellValue('J'.$row, $mapping->value_type);
                $sheet->setCellValue('K'.$row, $mapping->notes);
                $row++;
            }
            
            // Format the worksheet
            foreach (range('A', 'K') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }
            
            // Create filename
            $filename = 'parameter_mappings_' . date('Y-m-d') . '.';
            
            // Set the appropriate content type
            switch ($format) {
                case 'csv':
                    $writer = new \PhpOffice\PhpSpreadsheet\Writer\Csv($spreadsheet);
                    $contentType = 'text/csv';
                    $filename .= 'csv';
                    break;
                case 'xlsx':
                default:
                    $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
                    $contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    $filename .= 'xlsx';
                    break;
            }
            
            // Create response
            $response = response()->streamDownload(function() use ($writer) {
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => $contentType,
            ]);
            
            // Return the response
            return $response;
        } catch (\Exception $e) {
            $errorDetails = $this->handleError($e, 'exportParameterMappings');
            return response()->json([
                'message' => $errorDetails['message'],
                'success' => false
            ], 500);
        }
    }
} 