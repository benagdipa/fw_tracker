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
