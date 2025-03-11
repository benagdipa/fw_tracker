<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ImplementationController;
use App\Http\Controllers\SQLImportController;
use App\Http\Controllers\TableWizardController;
use App\Http\Controllers\WNTDController;
use App\Http\Controllers\RANConfigurationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Authentication Routes
Route::get('/', [AuthenticatedSessionController::class, 'create']);

// Page Routes
Route::controller(PageController::class)
    ->middleware('auth')
    ->group(function () {
        Route::get('dashboard', 'dashboard')->name('dashboard');
        Route::get('tools-manager', 'toolsManager')->name('tools.manager');
        Route::get('import/progress', 'get_progress')->name('import.progress');
});

// Profile Routes
Route::controller(ProfileController::class)
    ->middleware('auth')
    ->prefix('profile')
    ->group(function () {
        Route::get('/', 'edit')->name('profile.edit');
        Route::patch('/', 'update')->name('profile.update');
        Route::delete('/', 'destroy')->name('profile.destroy');
});

// Settings Routes
Route::controller(SettingsController::class)
    ->middleware('auth')
    ->prefix('settings')
    ->group(function () {
        Route::get('/', 'index')
            ->middleware('role:super-admin|editor|user')
            ->name('settings.index');
        Route::post('/', 'import_db_save')
            ->middleware('role:super-admin|editor')
            ->name('import.db.store');
        Route::delete('/{id}/delete', 'import_db_delete')
            ->middleware('role:super-admin|editor')
            ->name('import.db.delete');
});

// WNTD Routes
Route::controller(WNTDController::class)
    ->middleware('auth')
    ->prefix('wntd')
    ->group(function () {
        Route::get('/', 'index')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('wntd.field.name.index');
        Route::post('/import/csv', 'import_from_csv')
            ->middleware('role:super-admin|admin')
            ->name('wntd.field.name.import');
        Route::post('/map_fields', 'map_and_save_csv')
            ->middleware('role:super-admin|admin')
            ->name('wntd.field.name.map.save');
        Route::post('/artifacts', 'save_artifacts')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('wntd.field.name.update.artifacts');
        Route::post('/', 'save_item')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('wntd.field.name.update');
        Route::get('/show/{id}', 'show')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('wntd.field.name.show');
        Route::get('/edit/{id}', 'edit')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('wntd.field.name.edit');
        Route::get('/export', 'export')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('wntd.field.name.export');
        Route::delete('/{id}/delete', 'destroy')
            ->middleware('role:super-admin|admin')
            ->name('wntd.field.name.delete');
        Route::post('/add-row', 'add_row')
            ->middleware('role:super-admin|admin')
            ->name('wntd.field.name.add.row');
});

// Implementation Routes
Route::controller(ImplementationController::class)
    ->middleware('auth')
    ->prefix('implementation-tracker')
    ->group(function () {
        Route::get('/', 'index')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('implementation.field.name.index');
        Route::post('/import/csv', 'import_from_csv')
            ->middleware('role:super-admin|admin')
            ->name('implementation.field.name.import');
        Route::post('/map_fields', 'map_and_save_csv')
            ->middleware('role:super-admin|admin')
            ->name('implementation.field.map.save');
        Route::post('/artifacts', 'save_artifacts')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('implementation.field.name.update.artifacts');
        Route::post('/', 'save_item')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('implementation.field.name.save.item');
        Route::get('/show/{id}', 'show')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('implementation.field.name.show');
        Route::get('/export', 'export')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('implementation.field.name.export');
        Route::delete('/{id}/delete', 'destroy')
            ->middleware('role:super-admin|admin')
            ->name('implementation.field.name.destroy');
        Route::post('/add-row', 'add_row')
            ->middleware('role:super-admin|admin')
            ->name('implementation.field.name.add.row');
});

// SQL Import Routes
Route::controller(SQLImportController::class)
    ->middleware('auth')
    ->prefix('dashboard/sql-import')
    ->group(function () {
        Route::get('/{id}', 'index')
            ->middleware('role:super-admin|editor|user')
            ->name('sql.import');
        Route::get('/starburst/{id}', 'import_starburst')
            ->middleware('role:super-admin|editor|user')
            ->name('sql.import.starburst');
        Route::post('/run', 'run_sql_code')
            ->middleware('role:super-admin|editor|user')
            ->name('sql.run');
        Route::post('/store', 'store')
            ->middleware('role:super-admin|editor')
            ->name('sql.store');
});

// Table Wizard Routes
Route::controller(TableWizardController::class)
    ->middleware(['auth', 'role:super-admin'])
    ->prefix('dashboard/table-wizard')
    ->group(function () {
        Route::get('/', 'index')->name('table.wizard.index');
        Route::post('/store', 'store')->name('table.wizard.store');
        Route::get('/{id}/columns', 'column_index')->name('table.wizard.column.index');
        Route::post('/columns/store', 'column_store')->name('table.wizard.column.store');
        Route::get('/{slug}/table', 'view_table_item')->name('view.table.item');
        Route::post('/table/import_csv', 'import_from_csv')->name('table.import.csv');
        Route::post('/table/map_csv', 'map_and_save_csv')->name('table.map.save');
        Route::post('/table/add/column', 'add_column')->name('table.add.column');
        Route::post('/table/hide/column', 'hide_column')->name('table.hide.column');
        Route::post('/table/rename/column', 'rename_column')->name('table.rename.column');
        Route::post('/table/delete/column', 'delete_column')->name('table.delete.column');
        Route::post('/table/save/{id}/row', 'save_row')->name('table.save.row');
        Route::post('/table/add/row', 'add_row')->name('table.add.row');
        Route::post('/table/upload/{id}/row/artifacts', 'upload_artifacts')->name('table.upload.row.artifacts');
        Route::delete('/table/delete/{id}/row', 'delete_row')->name('table.delete.row');
        Route::post('/table/rearrange/column', 'rearrange_column')->name('table.rearrange.column');
        Route::post('/table/restore', 'restore_column')->name('table.restore.column');
        Route::delete('/table/{id}/delete', 'delete_table')->name('table.delete');
});

// RAN Configuration Web Routes
Route::controller(RANConfigurationController::class)
    ->middleware('auth')
    ->prefix('ran-configuration')
    ->group(function () {
        Route::get('/', 'index')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('ran.configuration.index');
        Route::get('/export', 'export')
            ->middleware('role:super-admin|admin|editor|user')
            ->name('ran.configuration.export');
});

// Error routes
Route::get('/error/{code?}', function ($code = 500) {
    return Inertia::render('Error/GenericError', [
        'statusCode' => $code,
    ]);
})->name('error');

// Legacy route for Excel reading
Route::get('/read_excel.php', function () {
    require base_path('read_excel.php');
})->name('read.excel');

// Include authentication routes
require base_path('routes/auth.php'); 