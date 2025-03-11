<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Admin Routes
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    // Dashboard and analytics
    Route::get('/', [AdminController::class, 'index'])->name('admin.index');
    Route::get('/analytics', [AdminController::class, 'analytics'])->name('admin.analytics');
    
    // Settings management
    Route::get('/settings', [AdminController::class, 'settings'])->name('admin.settings');
    Route::post('/settings', [AdminController::class, 'updateSettings'])->name('admin.settings.update');
    Route::post('/backup/create', [AdminController::class, 'createBackup'])->name('admin.backup.create');
});

// Role Management Routes
Route::controller(RoleController::class)
    ->middleware(['auth', 'role:super-admin'])
    ->prefix('admin/roles')
    ->group(function () {
        Route::get('/', 'index')->name('roles.index');
        Route::get('/access', 'access')->name('roles.access');
        Route::post('/update-access', 'updateAccess')->name('roles.updateAccess');
        Route::post('/search', 'search_user')->name('roles.user.search');
        Route::post('/store', 'user_add_to_role')->name('roles.user.store');
        Route::post('/create', 'createRole')->name('roles.create');
        Route::delete('/{role}', 'deleteRole')->name('roles.destroy');
});

// Enhanced User Management Routes
Route::controller(UserController::class)
    ->middleware(['auth', 'role:super-admin|admin'])
    ->prefix('admin/users')
    ->group(function () {
        Route::get('/', 'index')->name('users.index');
        Route::get('/create', 'create')->name('users.create');
        Route::post('/', 'store')->name('users.store');
        Route::get('/{user}/edit', 'edit')->name('users.edit');
        Route::put('/{user}', 'update')->name('users.update');
        Route::delete('/{user}', 'destroy')->name('users.destroy');
}); 