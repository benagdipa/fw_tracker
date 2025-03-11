<?php

use App\Http\Controllers\APIHandlerController;
use App\Http\Controllers\ErrorController;
use App\Http\Controllers\RANConfigurationController;
use Illuminate\Support\Facades\Route;

// API Handler Routes
Route::controller(APIHandlerController::class)
    ->middleware('auth')
    ->prefix('api')
    ->group(function () {
        // WNTD CRUD operations
        Route::post('/wntd/update', 'updateWNTD')
            ->middleware('role:super-admin|editor|user')
            ->name('api.wntd.field.name.update');
        Route::post('/wntd/add-row', 'addWNTDRow')
            ->middleware('role:super-admin|editor')
            ->name('api.wntd.field.name.add.row');
        
        // Implementation Tracker CRUD operations
        Route::post('/implementation/update', 'updateImplementation')
            ->middleware('role:super-admin|editor|user')
            ->name('implementation.field.name.update');
        Route::post('/implementation/add-row', 'addImplementationRow')
            ->middleware('role:super-admin|editor')
            ->name('api.implementation.field.name.add.row');
        Route::delete('/implementation/delete/{id}', 'deleteImplementation')
            ->middleware('role:super-admin|editor|user')
            ->name('implementation.field.name.delete');
});

// RAN Configuration API Routes
Route::controller(RANConfigurationController::class)
    ->middleware('auth')
    ->prefix('api/ran-configuration')
    ->group(function () {
        Route::get('/excel-data', 'getExcelData')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('ran.configuration.excel.data');
        Route::post('/import-from-excel', 'importFromExcel')
            ->middleware('role:super-admin|admin')
            ->name('ran.configuration.import.excel');
        Route::post('/import-file', 'importFile')
            ->middleware('role:super-admin|admin')
            ->name('ran.configuration.import.file');
        Route::get('/download-template/{targetTable}/{format}', 'downloadTemplate')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('ran.configuration.download.template');
        
        // Struct Parameters CRUD
        Route::post('/struct-parameters/create', 'createStructParameter')
            ->middleware('role:super-admin|admin|editor')
            ->name('ran.configuration.struct.parameters.create');
        Route::post('/struct-parameters/update', 'updateStructParameter')
            ->middleware('role:super-admin|admin|editor')
            ->name('ran.configuration.struct.parameters.update');
        Route::post('/struct-parameters/delete', 'deleteStructParameter')
            ->middleware('role:super-admin|admin|editor')
            ->name('ran.configuration.struct.parameters.delete');
        
        // Parameters CRUD
        Route::post('/parameters/create', 'createParameter')
            ->middleware('role:super-admin|admin|editor')
            ->name('ran.configuration.parameters.create');
        Route::post('/parameters/update', 'updateParameter')
            ->middleware('role:super-admin|admin|editor')
            ->name('ran.configuration.parameters.update');
        Route::post('/parameters/delete', 'deleteParameter')
            ->middleware('role:super-admin|admin|editor')
            ->name('ran.configuration.parameters.delete');
});

// Error logging API endpoint
Route::post('/error/log', [ErrorController::class, 'logClientError'])
    ->middleware('web')
    ->name('api.error.log'); 