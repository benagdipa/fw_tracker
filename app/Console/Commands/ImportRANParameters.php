<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\RANParameter;

class ImportRANParameters extends Command
{
    protected $signature = 'ran:import {file : Path to the Excel file}';
    protected $description = 'Import RAN parameters from Excel file';

    public function handle()
    {
        $this->info('Starting RAN parameters import...');

        try {
            $inputFileName = $this->argument('file');
            $spreadsheet = IOFactory::load($inputFileName);
            $worksheet = $spreadsheet->getActiveSheet();
            $data = [];

            // Get headers from first row
            $headers = [];
            foreach ($worksheet->getRowIterator(1, 1) as $row) {
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);
                foreach ($cellIterator as $cell) {
                    $headers[] = strtolower(str_replace(' ', '_', trim($cell->getValue())));
                }
            }

            // Get data rows
            $rowCount = 0;
            foreach ($worksheet->getRowIterator(2) as $row) {
                $rowData = [];
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);
                
                $i = 0;
                foreach ($cellIterator as $cell) {
                    if (isset($headers[$i])) {
                        $rowData[$headers[$i]] = $cell->getValue();
                    }
                    $i++;
                }

                // Skip empty rows
                if (empty(array_filter($rowData))) {
                    continue;
                }

                // Determine if this is a struct parameter based on the data
                $isStruct = isset($rowData['value_range']) && !empty($rowData['value_range']);
                $rowData['type'] = $isStruct ? 'struct' : 'parameter';

                // Create or update the parameter
                RANParameter::updateOrCreate(
                    ['parameter_name' => $rowData['parameter_name']],
                    $rowData
                );

                $rowCount++;
                if ($rowCount % 100 === 0) {
                    $this->info("Processed $rowCount rows...");
                }
            }

            $this->info("Import completed successfully. Total rows processed: $rowCount");

        } catch (\Exception $e) {
            $this->error('Error importing data: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
} 