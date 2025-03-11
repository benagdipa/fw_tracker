Write-Host "Fixing migration issue for sslrequired column..." -ForegroundColor Green
Write-Host "1. Running the migration with the updated check..." -ForegroundColor Yellow

php artisan migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Migration failed. Trying alternative approach..." -ForegroundColor Red
    
    # Alternative approach - Manually add the migration record to the migrations table
    Write-Host "2. Adding migration record directly to database..." -ForegroundColor Yellow
    
    $timestamp = Get-Date -Format "Y-MM-dd HH:mm:ss"
    $sql = "INSERT INTO migrations (migration, batch) VALUES ('2025_03_11_150811_add_sslrequired_to_import_d_b_s_table', 2)"
    
    php artisan tinker --execute="DB::insert('$sql');"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migration record added successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to add migration record. Please check your database configuration." -ForegroundColor Red
    }
}

# Verify migration status
Write-Host "Checking migration status:" -ForegroundColor Cyan
php artisan migrate:status | Select-String -Pattern "2025_03_11_150811"

Write-Host "Fix completed!" -ForegroundColor Green 