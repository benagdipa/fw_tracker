<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\RANConfigurationController;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImportRANExcelData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ran:import-excel {file? : Path to the Excel file} {target_table=struct_parameters : Target table (struct_parameters or parameters)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import RAN Configuration data from Excel file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting import of RAN Configuration data from Excel...');
        
        try {
            $filePath = $this->argument('file');
            $targetTable = $this->argument('target_table');
            
            if (!$filePath) {
                // If no file provided, use the default method that creates sample data
                $controller = app()->make(RANConfigurationController::class);
                $request = new Request(); // Create an empty request object
                $result = $controller->importFromExcel($request);
            } else {
                // Check if file exists
                if (!file_exists($filePath)) {
                    $this->error("File not found: $filePath");
                    return Command::FAILURE;
                }
                
                // Create a request with file and target table
                $file = new UploadedFile($filePath, basename($filePath));
                
                // Use the RANImportService directly
                $importService = app()->make(\App\Services\RANImportService::class);
                
                // Use default column mappings based on the table
                if ($targetTable === 'struct_parameters') {
                    $columnMappings = $this->getStructParameterMappings();
                } else {
                    $columnMappings = $this->getParameterMappings();
                }
                
                $result = $importService->importFromExcel($filePath, $targetTable, $columnMappings);
                
                // Format result for console output
                if ($result['success']) {
                    $this->info('Successfully imported RAN Configuration data!');
                    $this->info("Imported: {$result['successCount']} records");
                    $this->info("Failed: {$result['failedCount']} records");
                    
                    if (!empty($result['errors'])) {
                        $this->warn('Errors encountered:');
                        foreach ($result['errors'] as $error) {
                            $this->warn("  - $error");
                        }
                    }
                    
                    return Command::SUCCESS;
                } else {
                    $this->error('Failed to import data: ' . ($result['message'] ?? 'Unknown error'));
                    return Command::FAILURE;
                }
            }
            
            $response = json_decode($result->getContent());
            
            if ($response->success) {
                $this->info('Successfully imported RAN Configuration data!');
                return Command::SUCCESS;
            } else {
                $this->error('Failed to import data: ' . ($response->message ?? 'Unknown error'));
                return Command::FAILURE;
            }
        } catch (\Exception $e) {
            $this->error('Error importing data: ' . $e->getMessage());
            return Command::FAILURE;
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
} 