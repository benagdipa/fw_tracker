<?php

use App\Http\Controllers\RANConfigurationController;
use App\Http\Controllers\WNTDController;
use App\Http\Controllers\ImplementationController;
use App\Http\Controllers\APIHandlerController;
use App\Http\Controllers\SQLImportController;
use App\Http\Controllers\ErrorController;
use Illuminate\Support\Facades\Route;

// Apply rate limiting and web middleware to all API routes for CSRF protection
Route::middleware(['web', 'auth', 'rate.limit'])->group(function () {
    // RAN Configuration Routes
    Route::get('/ran-configuration/excel-data', [RANConfigurationController::class, 'getExcelData']);
    Route::post('/ran-configuration/import', [RANConfigurationController::class, 'importFromExcel']);
    Route::get('/ran-configuration/export', [RANConfigurationController::class, 'export']);
    Route::post('/ran-configuration/parameters/update', [RANConfigurationController::class, 'updateParameter']);
    Route::delete('/ran-configuration/parameters/delete', [RANConfigurationController::class, 'deleteParameter']);

    // WNTD Routes
    Route::get('/wntd/download-template/{targetTable}/{format}', [WNTDController::class, 'downloadTemplate'])
        ->middleware('role:super-admin|admin|editor|user');
    Route::post('/wntd/import-file', [WNTDController::class, 'importFile'])
        ->middleware('role:super-admin|admin');

    // Implementation Routes
    Route::get('/implementation/download-template/{targetTable}/{format}', [ImplementationController::class, 'downloadTemplate'])
        ->middleware('role:super-admin|admin|editor|user');
    Route::post('/implementation/import-file', [ImplementationController::class, 'importFile'])
        ->middleware('role:super-admin|admin');

    // SQL Import Routes
    Route::post('/sql-import/upload', [SQLImportController::class, 'upload'])
        ->middleware('role:super-admin|admin');
    Route::get('/sql-import/status', [SQLImportController::class, 'getImportStatus'])
        ->middleware('role:super-admin|admin');

    // API Handler Routes
    Route::post('/external/fetch', [APIHandlerController::class, 'fetchExternalData'])
        ->middleware('role:super-admin|admin');
    Route::get('/external/status', [APIHandlerController::class, 'getStatus'])
        ->middleware('role:super-admin|admin');

    // API Handler Routes
    Route::controller(APIHandlerController::class)
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
});

// Error logging API endpoints - ensure they have web middleware for CSRF
Route::post('/error/log', [ErrorController::class, 'logClientError'])
    ->middleware('web')
    ->name('api.error.log');
    
// New route for improved client error handling
Route::post('/log-client-error', [ErrorController::class, 'logClientError'])
    ->middleware('web')
    ->name('api.log.client.error'); 