<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\RANParameter;
use App\Models\RANStructParameter;
use App\Models\RANParameterHistory;
use App\Services\RANImportService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class RANConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_ran_parameter()
    {
        $data = [
            'parameter_id' => 'TEST001',
            'parameter_name' => 'Test Parameter',
            'parameter_value' => '100',
            'description' => 'Test Description',
            'domain' => '0-1000',
            'data_type' => 'Integer',
            'mo_reference' => 'TestMO',
            'default_value' => '0',
            'category' => 'Test',
            'technology' => '4G',
            'vendor' => 'Test Vendor',
            'applicability' => 'All',
            'status' => 'active',
            'type' => 'parameter',
            'value' => '100',
            'unit' => 'ms'
        ];

        $parameter = RANParameter::create($data);

        $this->assertDatabaseHas('ran_parameters', [
            'parameter_id' => 'TEST001',
            'parameter_name' => 'Test Parameter'
        ]);

        $this->assertDatabaseHas('ran_parameter_history', [
            'parameter_id' => $parameter->id,
            'field_name' => 'parameter_value',
            'new_value' => '100',
            'change_type' => 'create'
        ]);
    }

    public function test_can_create_ran_struct_parameter()
    {
        $data = [
            'model' => 'TestModel',
            'mo_class_name' => 'TestClass',
            'parameter_name' => 'Test Struct Parameter',
            'seq' => 1,
            'parameter_description' => 'Test Description',
            'data_type' => 'String',
            'range' => '1-10',
            'def' => '5',
            'mul' => false,
            'unit' => 'units',
            'rest' => 'None',
            'read' => 'Yes',
            'restr' => 'None',
            'manc' => 'M',
            'pers' => 'P',
            'syst' => 'S',
            'change' => 'C',
            'dist' => 'D',
            'dependencies' => 'None',
            'dep' => 'None',
            'obs' => 'Test Observation',
            'prec' => '0.1'
        ];

        $parameter = RANStructParameter::create($data);

        $this->assertDatabaseHas('ran_struct_parameters', [
            'model' => 'TestModel',
            'mo_class_name' => 'TestClass',
            'parameter_name' => 'Test Struct Parameter'
        ]);
    }

    public function test_can_import_ran_parameters()
    {
        Storage::fake('local');

        // Create a test CSV file
        $content = "parameter_id,parameter_name,parameter_value,description,domain,data_type,type\n";
        $content .= "TEST001,Test Parameter,100,Test Description,0-1000,Integer,parameter\n";
        $content .= "TEST002,Test Parameter 2,200,Test Description 2,0-2000,Integer,parameter\n";

        // Create a temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'test_');
        file_put_contents($tempFile, $content);

        $importService = new RANImportService('parameter');

        $columnMappings = [
            'parameter_id' => 'parameter_id',
            'parameter_name' => 'parameter_name',
            'parameter_value' => 'parameter_value',
            'description' => 'description',
            'domain' => 'domain',
            'data_type' => 'data_type',
            'type' => 'type'
        ];

        $result = $importService->importFromExcel($tempFile, 'parameters', $columnMappings);

        // Clean up
        unlink($tempFile);

        $this->assertTrue($result['success']);
        $this->assertEquals(2, $result['successCount']);
        $this->assertEquals(0, $result['failedCount']);

        $this->assertDatabaseHas('ran_parameters', [
            'parameter_id' => 'TEST001',
            'parameter_name' => 'Test Parameter',
            'parameter_value' => '100',
            'type' => 'parameter'
        ]);

        $this->assertDatabaseHas('ran_parameters', [
            'parameter_id' => 'TEST002',
            'parameter_name' => 'Test Parameter 2',
            'parameter_value' => '200',
            'type' => 'parameter'
        ]);
    }
} 