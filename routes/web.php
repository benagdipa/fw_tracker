<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ImplementationController;
use App\Http\Controllers\SQLImportController;
use App\Http\Controllers\TableWizardController;
use App\Http\Controllers\CacheStarburstDBController;
use App\Http\Controllers\WNTDController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RANConfigurationController;
use App\Http\Controllers\APIHandlerController;
use App\Http\Controllers\ToolsManagerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Special route to refresh CSRF token - exclude from CSRF protection
Route::get('/refresh-csrf', function () {
    return response()->json(['token' => csrf_token()]);
})->withoutMiddleware(['web', 'csrf']);

// Apply web middleware to all routes to ensure CSRF protection
Route::middleware(['web'])->group(function() {
    Route::get('/', [AuthenticatedSessionController::class, 'create']);

    // Start Dynamic Routes
    Route::controller(WNTDController::class)->middleware('auth')->group(function () {
        Route::get('wntd', 'index')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('wntd.field.name.index');
        Route::post('wntd/import/csv', 'import_from_csv')->middleware(['auth', 'role:super-admin|admin'])->name('wntd.field.name.import');
        Route::post('wntd/map_fields', 'map_and_save_csv')->middleware(['auth', 'role:super-admin|admin'])->name('wntd.field.name.map.save');
        Route::post('wntd/artifacts', 'save_artifacts')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('wntd.field.name.update.artifacts');
        Route::post('wntd', 'save_item')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('wntd.field.name.save.item');
        Route::get('wntd/show/{id}', 'show')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('wntd.field.name.show');
        Route::get('wntd/edit/{id}', 'edit')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('wntd.field.name.edit');
        Route::get('wntd/export', 'export')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('wntd.field.name.export');
        Route::delete('wntd/{id}/delete', 'destroy')->middleware(['auth', 'role:super-admin|admin'])->name('wntd.field.name.delete');
        Route::post('wntd/add-row', 'add_row')->middleware(['auth', 'role:super-admin|admin'])->name('wntd.field.name.add.row');
        Route::get('api/wntd/download-template/{targetTable}/{format}', 'downloadTemplate')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('wntd.download.template');
        Route::post('api/wntd/import-file', 'importFile')->middleware(['auth', 'role:super-admin|admin'])->name('wntd.import.file');
    });
    Route::controller(ImplementationController::class)->middleware('auth')->group(function () {
        Route::get('implementation-tracker', 'index')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('implementation.field.name.index');
        Route::get('api/implementation/download-template/{targetTable}/{format}', 'downloadTemplate')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('implementation.download.template');
        Route::post('api/implementation/import-file', 'importFile')->middleware(['auth', 'role:super-admin|admin'])->name('implementation.import.file');
        Route::post('implementation-tracker/import/csv', 'import_from_csv')->middleware(['auth', 'role:super-admin|admin'])->name('implementation.field.name.import');
        Route::post('implementation-tracker/map_fields', 'map_and_save_csv')->middleware(['auth', 'role:super-admin|admin'])->name('implementation.field.map.save');
        Route::post('implementation-tracker/artifacts', 'save_artifacts')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('implementation.field.name.update.artifacts');
        Route::post('implementation-tracker', 'save_item')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('implementation.field.name.save.item');
        Route::get('implementation-tracker/show/{id}', 'show')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('implementation.field.name.show');
        Route::get('implementation-tracker/export', 'export')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('implementation.field.name.export');
        Route::delete('implementation-tracker/{id}/delete', 'destroy')->middleware(['auth', 'role:super-admin|admin'])->name('implementation.field.name.destroy');
        Route::post('implementation-tracker/add-row', 'add_row')->middleware(['auth', 'role:super-admin|admin'])->name('implementation.field.name.add.row');
    });
    Route::controller(PageController::class)->middleware('auth')->group(function () {
        Route::get('dashboard', 'dashboard')->name('dashboard');
        Route::get('import/progress', 'get_progress')->name('import.progress');
    });

    // Tools Manager Route
    Route::get('tools-manager', [ToolsManagerController::class, 'index'])
        ->middleware('auth')
        ->name('tools.manager');

    Route::controller(SQLImportController::class)->middleware('auth')->group(function () {
        Route::get('dashboard/sql-import/{id}', 'index')->middleware(['auth', 'role:super-admin|editor|user'])->name('sql.import');
        Route::get('dashboard/sql-import-starburst/{id}', 'import_starburst')->middleware(['auth', 'role:super-admin|editor|user'])->name('sql.import.starburst');
        Route::post('dashboard/sql-import/run', 'run_sql_code')->middleware(['auth', 'role:super-admin|editor|user'])->name('sql.run');
        Route::post('dashboard/sql-import/store', 'store')->middleware(['auth', 'role:super-admin|editor'])->name('sql.store');
    });
    Route::controller(SettingsController::class)->middleware('auth')->group(function () {
        Route::get('settings', 'index')->middleware(['auth', 'role:super-admin|editor|user'])->name('settings.index');
        Route::post('settings', 'import_db_save')->middleware(['auth', 'role:super-admin|editor'])->name('import.db.store');
        Route::delete('settings/{id}/delete', 'import_db_delete')->middleware(['auth', 'role:super-admin|editor'])->name('import.db.delete');
    });
    Route::controller(RoleController::class)->middleware('auth')->group(function () {
        Route::get('dashboard/roles', 'index')->middleware(['auth', 'role:super-admin'])->name('roles.index');
        Route::get('dashboard/roles/access', 'access')->middleware(['auth', 'role:super-admin'])->name('roles.access');
        Route::post('dashboard/roles/update-access', 'updateAccess')->middleware(['auth', 'role:super-admin'])->name('roles.updateAccess');
        Route::post('dashboard/roles/search', 'search_user')->middleware(['auth', 'role:super-admin'])->name('roles.user.search');
        Route::post('dashboard/roles/store', 'user_add_to_role')->middleware(['auth', 'role:super-admin'])->name('roles.user.store');
        Route::post('dashboard/roles/create', 'createRole')->middleware(['auth', 'role:super-admin'])->name('roles.create');
        Route::delete('dashboard/roles/{role}', 'deleteRole')->middleware(['auth', 'role:super-admin'])->name('roles.destroy');
        Route::get('dashboard/users', 'users')->middleware(['auth', 'role:super-admin'])->name('roles.users.view');
        Route::get('dashboard/users/create', 'createUser')->middleware(['auth', 'role:super-admin'])->name('roles.users.create');
        Route::post('dashboard/users', 'storeUser')->middleware(['auth', 'role:super-admin'])->name('roles.users.store');
        Route::get('dashboard/users/{user}/edit', 'editUser')->middleware(['auth', 'role:super-admin'])->name('roles.users.edit');
        Route::put('dashboard/users/{user}', 'updateUser')->middleware(['auth', 'role:super-admin'])->name('roles.users.update');
        Route::delete('roles/users/{user}', 'destroyUser')->middleware(['auth', 'role:super-admin'])->name('roles.users.destroy');
    });

    // Enhanced User Management Routes
    Route::controller(UserController::class)->middleware('auth')->group(function () {
        Route::get('/users', 'index')->middleware(['auth', 'role:super-admin|admin'])->name('users.index');
        Route::get('/users/create', 'create')->middleware(['auth', 'role:super-admin|admin'])->name('users.create');
        Route::post('/users', 'store')->middleware(['auth', 'role:super-admin|admin'])->name('users.store');
        Route::get('/users/{user}/edit', 'edit')->middleware(['auth', 'role:super-admin|admin'])->name('users.edit');
        Route::put('/users/{user}', 'update')->middleware(['auth', 'role:super-admin|admin'])->name('users.update');
        Route::delete('/users/{user}', 'destroy')->middleware(['auth', 'role:super-admin'])->name('users.destroy');
        
        // Profile management routes
        Route::put('/profile/update', 'updateProfile')->name('profile.info.update');
        Route::put('/profile/password', 'updatePassword')->name('profile.password.update');
    });

    Route::controller(ProfileController::class)->middleware('auth')->group(function () {
        Route::get('profile', 'edit')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('profile.edit');
        Route::patch('profile', 'update')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('profile.update');
        Route::delete('profile', 'destroy')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('profile.destroy');
    });
    Route::controller(TableWizardController::class)->middleware('auth')->group(function () {
        Route::get('dashboard/table-wizard', 'index')->middleware(['auth', 'role:super-admin'])->name('table.wizard.index');
        Route::post('dashboard/table-wizard/store', 'store')->middleware(['auth', 'role:super-admin'])->name('table.wizard.store');
        Route::get('dashboard/table-wizard/{id}/columns', 'column_index')->middleware(['auth', 'role:super-admin'])->name('table.wizard.column.index');
        Route::post('dashboard/table-wizard/columns/store', 'column_store')->middleware(['auth', 'role:super-admin'])->name('table.wizard.column.store');
        Route::get('dashboard/{slug}/table', 'view_table_item')->middleware(['auth', 'role:super-admin'])->name('view.table.item');
        Route::post('dashboard/table/import_csv', 'import_from_csv')->middleware(['auth', 'role:super-admin'])->name('table.import.csv');
        Route::post('dashboard/table/map_csv', 'map_and_save_csv')->middleware(['auth', 'role:super-admin'])->name('table.map.save');
        Route::post('dashboard/table/add/column', 'add_column')->middleware(['auth', 'role:super-admin'])->name('table.add.column');
        Route::post('dashboard/table/hide/column', 'hide_column')->middleware(['auth', 'role:super-admin'])->name('table.hide.column');
        Route::post('dashboard/table/rename/column', 'rename_column')->middleware(['auth', 'role:super-admin'])->name('table.rename.column');
        Route::post('dashboard/table/delete/column', 'delete_column')->middleware(['auth', 'role:super-admin'])->name('table.delete.column');
        Route::post('dashboard/table/save/{id}/row', 'save_row')->middleware(['auth', 'role:super-admin'])->name('table.save.row');
        Route::post('dashboard/table/add/row', 'add_row')->middleware(['auth', 'role:super-admin'])->name('table.add.row');
        Route::post('dashboard/table/upload/{id}/row/artifacts', 'upload_artifacts')->middleware(['auth', 'role:super-admin'])->name('table.upload.row.artifacts');
        Route::delete('dashboard/table/delete/{id}/row', 'delete_row')->middleware(['auth', 'role:super-admin'])->name('table.delete.row');
        Route::post('dashboard/table/rearrange/column', 'rearrange_column')->middleware(['auth', 'role:super-admin'])->name('table.rearrange.column');
        Route::post('dashboard/table/restore', 'restore_column')->middleware(['auth', 'role:super-admin'])->name('table.restore.column');
        Route::delete('dashboard/table/{id}/delete', 'delete_table')->middleware(['auth', 'role:super-admin'])->name('table.delete');
    });
});

// Admin Routes
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    // Dashboard and analytics
    Route::get('/', [AdminController::class, 'index'])->name('admin.index');
    Route::get('/analytics', [AdminController::class, 'analytics'])->name('admin.analytics');
    
    // Settings management
    Route::get('/settings', [AdminController::class, 'settings'])->name('admin.settings');
    Route::post('/settings', [AdminController::class, 'updateSettings'])->name('admin.settings.update');
    Route::post('/backup/create', [AdminController::class, 'createBackup'])->name('admin.backup.create');
    
    // User management
    Route::get('/users', [AdminController::class, 'users'])->name('admin.users');
    Route::post('/users', [AdminController::class, 'storeUser'])->name('admin.users.store');
    Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('admin.users.update');
    Route::delete('/users/{user}', [AdminController::class, 'deleteUser'])->name('admin.users.delete');
});

// Test routes for error pages
Route::get('/test-404', function () {
    abort(404);
});

Route::get('/test-500', function () {
    abort(500);
});

Route::get('/test-403', function () {
    abort(403);
});

// RAN Configuration Routes
Route::controller(RANConfigurationController::class)->middleware('auth')->group(function () {
    Route::get('ran-configuration', 'index')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('ran.configuration.index');
    Route::get('ran-configuration/export', 'export')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('ran.configuration.export');
    Route::get('api/ran-configuration/excel-data', 'getExcelData')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('ran.configuration.excel.data');
    Route::post('api/ran-configuration/import-from-excel', 'importFromExcel')->middleware(['auth', 'role:super-admin|admin'])->name('ran.configuration.import.excel');
    Route::post('api/ran-configuration/import-file', 'importFile')->middleware(['auth', 'role:super-admin|admin'])->name('ran.configuration.import.file');
    Route::get('api/ran-configuration/download-template/{targetTable}/{format}', 'downloadTemplate')->middleware(['auth', 'role:super-admin|admin|editor|user'])->name('ran.configuration.download.template');
    
    // Struct Parameters CRUD
    Route::post('api/ran-configuration/struct-parameters/create', 'createStructParameter')->middleware(['auth', 'role:super-admin|admin|editor'])->name('ran.configuration.struct.parameters.create');
    Route::post('api/ran-configuration/struct-parameters/update', 'updateStructParameter')->middleware(['auth', 'role:super-admin|admin|editor'])->name('ran.configuration.struct.parameters.update');
    Route::post('api/ran-configuration/struct-parameters/delete', 'deleteStructParameter')->middleware(['auth', 'role:super-admin|admin|editor'])->name('ran.configuration.struct.parameters.delete');
    
    // Parameters CRUD
    Route::post('api/ran-configuration/parameters/create', 'createParameter')->middleware(['auth', 'role:super-admin|admin|editor'])->name('ran.configuration.parameters.create');
    Route::post('api/ran-configuration/parameters/update', 'updateParameter')->middleware(['auth', 'role:super-admin|admin|editor'])->name('ran.configuration.parameters.update');
    Route::post('api/ran-configuration/parameters/delete', 'deleteParameter')->middleware(['auth', 'role:super-admin|admin|editor'])->name('ran.configuration.parameters.delete');
});

// Add API Handler routes for consistent CRUD operations
Route::controller(APIHandlerController::class)->middleware('auth')->group(function () {
    // WNTD CRUD operations
    Route::post('api/wntd/update', 'updateWNTD')->middleware(['auth', 'role:super-admin|editor|user'])->name('api.wntd.update');
    Route::post('api/wntd/add-row', 'addWNTDRow')->middleware(['auth', 'role:super-admin|editor'])->name('api.wntd.add.row');
    
    // Implementation Tracker CRUD operations
    Route::post('api/implementation/update', 'updateImplementation')->middleware(['auth', 'role:super-admin|editor|user'])->name('api.implementation.update');
    Route::post('api/implementation/add-row', 'addImplementationRow')->middleware(['auth', 'role:super-admin|editor'])->name('api.implementation.add.row');
    Route::delete('api/implementation/delete/{id}', 'deleteImplementation')->middleware(['auth', 'role:super-admin|editor|user'])->name('implementation.field.name.delete');
});

// Error routes
Route::get('/error/{code?}', function ($code = 500) {
    return Inertia::render('Error/GenericError', [
        'statusCode' => $code,
    ]);
})->name('error');

// Error logging API endpoint
Route::post('/api/error/log', [App\Http\Controllers\ErrorController::class, 'logClientError'])
    ->middleware('web')
    ->name('api.error.log');

// New client error logging API endpoint
Route::post('/api/log-client-error', [App\Http\Controllers\ErrorController::class, 'logClientError'])
    ->middleware('web')
    ->name('api.log.client.error');

Route::get('/read_excel.php', function () {
    require base_path('read_excel.php');
})->name('read.excel');

require __DIR__ . '/auth.php';

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Include organized route files - commented out to avoid duplicate route definitions
// Routes were already defined above
// require __DIR__ . '/admin/admin.php';
// require __DIR__ . '/api/api.php';
// require __DIR__ . '/web/web.php';
