# PowerShell script to clean up the codebase
# Run this script periodically to keep your Laravel project tidy

Write-Host "Starting codebase cleanup..." -ForegroundColor Cyan

# Clear Laravel cache files 
Write-Host "Clearing Laravel caches..." -ForegroundColor Yellow
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear

# Remove temporary files
Write-Host "Removing temporary files..." -ForegroundColor Yellow
$tempFilePatterns = @("*.log", "*.tmp", "*.bak", "*.swp", "*.swo")
foreach ($pattern in $tempFilePatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -Recurse -File -ErrorAction SilentlyContinue
    if ($files.Count -gt 0) {
        Write-Host "Removing $($files.Count) $pattern files" -ForegroundColor White
        $files | ForEach-Object { Remove-Item $_.FullName -Force }
    }
}

# Clear Node.js cache if exists
$npmCachePath = ".npm"
if (Test-Path $npmCachePath) {
    Write-Host "Clearing NPM cache..." -ForegroundColor Yellow
    Remove-Item -Path $npmCachePath -Recurse -Force
}

# Remove public/hot if exists (Vite hot module replacement file)
if (Test-Path "public/hot") {
    Write-Host "Removing public/hot..." -ForegroundColor Yellow
    Remove-Item -Path "public/hot" -Force
}

# Clean up storage logs
if (Test-Path "storage/logs") {
    Write-Host "Cleaning up storage logs..." -ForegroundColor Yellow
    Get-ChildItem -Path "storage/logs" -Filter "*.log" | 
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
        ForEach-Object { Remove-Item $_.FullName -Force }
}

# Storage link (in case it's needed)
Write-Host "Creating storage link (if needed)..." -ForegroundColor Yellow
php artisan storage:link --force

Write-Host "Codebase cleanup completed!" -ForegroundColor Green 