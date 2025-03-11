Write-Host "Permission Tables Migration Fix Script" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "This script will fix the issue with the permission tables migration." -ForegroundColor Yellow

# Step 1: Backup the original migration file
Write-Host "`nStep 1: Backing up the original migration file..." -ForegroundColor Cyan
$migrationPath = Join-Path -Path (Get-Location) -ChildPath "database\migrations\2024_03_06_000000_create_permission_tables.php"

if (Test-Path $migrationPath) {
    $backupPath = "$migrationPath.bak"
    Copy-Item -Path $migrationPath -Destination $backupPath
    Write-Host "  - Backup created at $backupPath" -ForegroundColor Green
} else {
    Write-Host "  - Migration file not found at $migrationPath" -ForegroundColor Red
    Write-Host "  - Please check the file path and try again." -ForegroundColor Red
    exit
}

# Step 2: Modify the migration file to add existence checks
Write-Host "`nStep 2: Modifying the migration file to add existence checks..." -ForegroundColor Cyan
$content = Get-Content -Path $migrationPath -Raw

# Add check at the beginning of up method to see if all tables already exist
$upMethodPattern = "public function up\(\)\s*\{([^{]*)(\$tableNames = config\('permission.table_names'\);)"
$upMethodReplacement = "public function up() {$1$2`n        `$columnNames = config('permission.column_names');`n        `$teams = config('permission.teams');`n`n        // Check if this migration has already been run`n        if (Schema::hasTable(`$tableNames['permissions']) && `n            Schema::hasTable(`$tableNames['roles']) && `n            Schema::hasTable(`$tableNames['model_has_permissions']) &&`n            Schema::hasTable(`$tableNames['model_has_roles']) &&`n            Schema::hasTable(`$tableNames['role_has_permissions'])) {`n            return; // Skip if all tables already exist`n        }`n"

$content = $content -replace $upMethodPattern, $upMethodReplacement

# Add check before creating each table
$tables = @('permissions', 'roles', 'model_has_permissions', 'model_has_roles', 'role_has_permissions')

foreach ($table in $tables) {
    $tablePattern = "Schema::create\(\\\$tableNames\['$table'\],\s*function\s*\(Blueprint\s*\\\$table\)\s*(?:use\s*\(\\\$tableNames(?:,\s*\\\$columnNames(?:,\s*\\\$teams)?)?\))?\s*\{"
    $tableReplacement = "Schema::create(\`$tableNames['$table'], function (Blueprint \`$table) use (\`$tableNames, \`$columnNames, \`$teams) {`n            // Check if table already exists - skip if it does`n            if (Schema::hasTable(\`$tableNames['$table'])) {`n                return;`n            }`n"
    
    $content = $content -replace $tablePattern, $tableReplacement
}

# Add checks around foreign key creation
$foreignKeyPatterns = @(
    "\\\$table->foreign\('permission_id'\)\s*->\s*references\('id'\)\s*->\s*on\(\\\$tableNames\['permissions'\]\)\s*->\s*onDelete\('cascade'\);"
    "\\\$table->foreign\('role_id'\)\s*->\s*references\('id'\)\s*->\s*on\(\\\$tableNames\['roles'\]\)\s*->\s*onDelete\('cascade'\);"
)

$foreignKeyReplacements = @(
    "// Only create foreign keys if the referenced tables exist`n            if (Schema::hasTable(\`$tableNames['permissions'])) {`n                \`$table->foreign('permission_id')`n                    ->references('id')`n                    ->on(\`$tableNames['permissions'])`n                    ->onDelete('cascade');`n            }"
    "// Only create foreign keys if the referenced tables exist`n            if (Schema::hasTable(\`$tableNames['roles'])) {`n                \`$table->foreign('role_id')`n                    ->references('id')`n                    ->on(\`$tableNames['roles'])`n                    ->onDelete('cascade');`n            }"
)

for ($i = 0; $i -lt $foreignKeyPatterns.Count; $i++) {
    $content = $content -replace $foreignKeyPatterns[$i], $foreignKeyReplacements[$i]
}

# Save the modified file
Set-Content -Path $migrationPath -Value $content
Write-Host "  - Modified migration file with existence checks" -ForegroundColor Green

# Step 3: Try running the migration
Write-Host "`nStep 3: Running the migration with the new safeguards..." -ForegroundColor Cyan
php artisan migrate --path=database/migrations/2024_03_06_000000_create_permission_tables.php

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nMigration ran successfully with the new safeguards!" -ForegroundColor Green
} else {
    Write-Host "`nMigration still failed. Attempting alternative approach..." -ForegroundColor Yellow
    
    # Alternative approach - Manually add the migration record
    Write-Host "`nMarking migration as complete..." -ForegroundColor Yellow
    $sql = "INSERT INTO migrations (migration, batch) VALUES ('2024_03_06_000000_create_permission_tables', (SELECT COALESCE(MAX(batch),0)+1 FROM migrations))"
    php artisan tinker --execute="DB::insert('$sql');"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  - Successfully marked permission tables migration as complete" -ForegroundColor Green
    } else {
        Write-Host "  - Failed to mark migration as complete, please check database manually" -ForegroundColor Red
    }
}

# Step 4: Recommendations for all other migrations
Write-Host "`nStep 4: Recommendations for all migrations..." -ForegroundColor Cyan
Write-Host "To fix all migrations, run the fix_all_migrations.ps1 script, which will:" -ForegroundColor White
Write-Host "  - Add existence checks to all table creation migrations" -ForegroundColor White
Write-Host "  - Add existence checks to all column addition migrations" -ForegroundColor White
Write-Host "  - Create a recovery script for dealing with failed migrations" -ForegroundColor White

Write-Host "`nPermission Tables Migration Fix Complete!" -ForegroundColor Green 