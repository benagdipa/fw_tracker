Write-Host "Comprehensive Migration Fix Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "This script will modify migrations to add existence checks and handle failed migrations." -ForegroundColor Yellow

# Step 1: Locate all migrations
Write-Host "`nStep 1: Locating all migration files..." -ForegroundColor Cyan
$migrationPath = Join-Path -Path (Get-Location) -ChildPath "database\migrations"
$migrationFiles = Get-ChildItem -Path $migrationPath -Filter "*.php"

Write-Host "Found $($migrationFiles.Count) migration files." -ForegroundColor White

# Step 2: Check which migrations need fixing (create table operations without existence checks)
Write-Host "`nStep 2: Analyzing migrations..." -ForegroundColor Cyan
$migrationsToFix = @()

foreach ($file in $migrationFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $needsFix = $false
    
    # Check if this is a "create table" migration without existence checks
    if ($content -match "Schema::create" -and $content -notmatch "if \(!Schema::hasTable") {
        $needsFix = $true
    }
    
    # Check if this is an "add column" migration without existence checks
    if ($content -match "\\\$table->([\w]+)\(" -and $content -notmatch "if \(!Schema::hasColumn") {
        $needsFix = $true
    }
    
    if ($needsFix) {
        $migrationsToFix += $file
        Write-Host "- $($file.Name) needs existence check" -ForegroundColor Yellow
    }
}

Write-Host "Found $($migrationsToFix.Count) migrations that need fixing." -ForegroundColor White

# Step 3: Modify migrations to add existence checks
Write-Host "`nStep 3: Modifying migrations to add existence checks..." -ForegroundColor Cyan

foreach ($file in $migrationsToFix) {
    Write-Host "Processing $($file.Name)..." -ForegroundColor White
    
    # Create backup
    $backupPath = "$($file.FullName).bak"
    Copy-Item -Path $file.FullName -Destination $backupPath
    
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false
    
    # Fix create table operations
    if ($content -match "Schema::create\s*\(\s*['`"](\w+)['`"]\s*,\s*function\s*\(\s*Blueprint\s*\\\$table\s*\)\s*{") {
        $tableName = $Matches[1]
        $replacement = "Schema::create('$tableName', function (Blueprint \$table) {`n            if (Schema::hasTable('$tableName')) {`n                return;`n            }`n"
        $content = $content -replace "Schema::create\s*\(\s*['`"]$tableName['`"]\s*,\s*function\s*\(\s*Blueprint\s*\\\$table\s*\)\s*{", $replacement
        $modified = $true
    }
    
    # Fix column additions in alter table operations
    if ($content -match "Schema::table\s*\(\s*['`"](\w+)['`"]\s*,\s*function\s*\(\s*Blueprint\s*\\\$table\s*\)\s*{") {
        $tableName = $Matches[1]
        
        # This is a more complex pattern that would require more detailed parsing
        # For now, let's wrap the entire function body with a check if the table exists
        $replacement = "Schema::table('$tableName', function (Blueprint \$table) {`n            if (!Schema::hasTable('$tableName')) {`n                return;`n            }`n"
        $content = $content -replace "Schema::table\s*\(\s*['`"]$tableName['`"]\s*,\s*function\s*\(\s*Blueprint\s*\\\$table\s*\)\s*{", $replacement
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "  - Added existence checks to $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "  - Could not automatically modify $($file.Name), more complex structure detected" -ForegroundColor Yellow
    }
}

# Step 4: Create a universal fix for the permission tables specifically
Write-Host "`nStep 4: Creating specific fix for permission tables migration..." -ForegroundColor Cyan
$permissionMigration = $migrationFiles | Where-Object { $_.Name -like "*create_permission_tables*" }

if ($permissionMigration) {
    $file = $permissionMigration[0]
    Write-Host "Found permission tables migration: $($file.Name)" -ForegroundColor White
    
    # Create a backup
    $backupPath = "$($file.FullName).special.bak"
    Copy-Item -Path $file.FullName -Destination $backupPath
    
    $content = Get-Content -Path $file.FullName -Raw
    
    # Add checks for each table creation in the permission migration
    $tablesToCheck = @('permissions', 'roles', 'model_has_permissions', 'model_has_roles', 'role_has_permissions')
    
    foreach ($table in $tablesToCheck) {
        if ($content -match "Schema::create\s*\(\s*['`"]$table['`"]\s*,\s*function\s*\(\s*Blueprint\s*\\\$table\s*\)\s*{") {
            $replacement = "Schema::create('$table', function (Blueprint \$table) {`n            if (Schema::hasTable('$table')) {`n                return;`n            }`n"
            $content = $content -replace "Schema::create\s*\(\s*['`"]$table['`"]\s*,\s*function\s*\(\s*Blueprint\s*\\\$table\s*\)\s*{", $replacement
        }
    }
    
    Set-Content -Path $file.FullName -Value $content
    Write-Host "  - Added existence checks to permission tables migration" -ForegroundColor Green
}

# Step 5: Create a script for handling failed migrations
Write-Host "`nStep 5: Creating migration recovery script..." -ForegroundColor Cyan

$recoveryScriptContent = @'
Write-Host "Migration Recovery Script" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "This script helps recover from failed migrations by marking them as complete." -ForegroundColor Yellow

# Check migration status
Write-Host "`nChecking migration status..." -ForegroundColor Cyan
$migrationStatus = php artisan migrate:status

# Parse the output to find pending migrations
$pendingMigrations = @()
$migrationStatus -split "`n" | ForEach-Object {
    if ($_ -match "\.+\s+Pending$") {
        if ($_ -match "(\d{4}_\d{2}_\d{2}_\d{6}_\w+)") {
            $pendingMigrations += $Matches[1]
        }
    }
}

if ($pendingMigrations.Count -eq 0) {
    Write-Host "No pending migrations found." -ForegroundColor Green
    exit
}

Write-Host "`nFound $($pendingMigrations.Count) pending migrations:" -ForegroundColor Yellow
$pendingMigrations | ForEach-Object { Write-Host "- $_" -ForegroundColor White }

# Try running migrations
Write-Host "`nAttempting to run migrations..." -ForegroundColor Cyan
$result = php artisan migrate --force

# Check for failed migrations
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nSome migrations failed. Would you like to:" -ForegroundColor Red
    Write-Host "1. Mark all pending migrations as complete without running them" -ForegroundColor White
    Write-Host "2. Run migrations one by one to identify the problematic one" -ForegroundColor White
    Write-Host "3. Exit without further action" -ForegroundColor White
    
    $choice = Read-Host "Enter your choice (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Host "`nMarking all pending migrations as complete..." -ForegroundColor Yellow
            
            $currentBatch = php artisan db:seed --class=GetCurrentBatchNumber
            $nextBatch = [int]$currentBatch + 1
            
            foreach ($migration in $pendingMigrations) {
                $sql = "INSERT INTO migrations (migration, batch) VALUES ('$migration', $nextBatch)"
                php artisan tinker --execute="DB::insert('$sql');"
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  - Marked $migration as complete" -ForegroundColor Green
                } else {
                    Write-Host "  - Failed to mark $migration as complete" -ForegroundColor Red
                }
            }
        }
        "2" {
            Write-Host "`nRunning migrations one by one..." -ForegroundColor Yellow
            
            foreach ($migration in $pendingMigrations) {
                Write-Host "Running migration: $migration..." -ForegroundColor White
                php artisan migrate --path=database/migrations/*$migration*
                
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "  - Migration $migration failed" -ForegroundColor Red
                    
                    $skipChoice = Read-Host "Skip this migration and mark as complete? (y/n)"
                    if ($skipChoice -eq "y") {
                        $sql = "INSERT INTO migrations (migration, batch) VALUES ('$migration', (SELECT COALESCE(MAX(batch),0)+1 FROM migrations))"
                        php artisan tinker --execute="DB::insert('$sql');"
                        
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "    - Marked $migration as complete" -ForegroundColor Green
                        } else {
                            Write-Host "    - Failed to mark $migration as complete" -ForegroundColor Red
                        }
                    }
                } else {
                    Write-Host "  - Migration $migration completed successfully" -ForegroundColor Green
                }
            }
        }
        default {
            Write-Host "`nExiting without further action." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "`nAll migrations completed successfully!" -ForegroundColor Green
}

# Final check
Write-Host "`nChecking final migration status..." -ForegroundColor Cyan
php artisan migrate:status
'@

$recoveryScriptPath = Join-Path -Path (Get-Location) -ChildPath "recover_migrations.ps1"
Set-Content -Path $recoveryScriptPath -Value $recoveryScriptContent

Write-Host "  - Created migration recovery script: recover_migrations.ps1" -ForegroundColor Green

# Step 6: Create a helper class to get the current batch number
Write-Host "`nStep 6: Creating batch number helper..." -ForegroundColor Cyan

$seederContent = @'
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GetCurrentBatchNumber extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $maxBatch = DB::table('migrations')->max('batch');
        echo $maxBatch ?? 0;
    }
}
'@

$seederPath = Join-Path -Path (Get-Location) -ChildPath "database\seeders\GetCurrentBatchNumber.php"
New-Item -Path $seederPath -Force -Value $seederContent | Out-Null

Write-Host "  - Created batch number helper: database\seeders\GetCurrentBatchNumber.php" -ForegroundColor Green

# Step 7: Final instructions
Write-Host "`nStep 7: Running migrations with new safeguards..." -ForegroundColor Cyan
Write-Host "Attempting to run migrations with the new safeguards..." -ForegroundColor Yellow

php artisan migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! All migrations completed successfully with the new safeguards." -ForegroundColor Green
} else {
    Write-Host "`nSome migrations still failed. You can use the recovery script to fix them:" -ForegroundColor Yellow
    Write-Host "  .\recover_migrations.ps1" -ForegroundColor White
}

Write-Host "`nMigration Fix Script Complete!" -ForegroundColor Green
Write-Host "Instructions for new developers:" -ForegroundColor Cyan
Write-Host "1. Run this script (fix_all_migrations.ps1) first to make all migrations safer" -ForegroundColor White
Write-Host "2. Run normal migrations: php artisan migrate" -ForegroundColor White
Write-Host "3. If any migrations fail, run: .\recover_migrations.ps1" -ForegroundColor White 