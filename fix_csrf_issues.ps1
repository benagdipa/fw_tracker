Write-Host "CSRF Token Issue Diagnostic and Fix Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clear all Laravel caches
Write-Host "Step 1: Clearing Laravel caches..." -ForegroundColor Yellow
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
php artisan clear-compiled

# Step 2: Verify session configuration
Write-Host "`nStep 2: Checking session configuration..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw
$sessionDriver = [regex]::Match($envContent, 'SESSION_DRIVER=([^\r\n]+)').Groups[1].Value
$sessionDomain = [regex]::Match($envContent, 'SESSION_DOMAIN=([^\r\n]+)').Groups[1].Value
$sessionLifetime = [regex]::Match($envContent, 'SESSION_LIFETIME=([^\r\n]+)').Groups[1].Value

Write-Host "  SESSION_DRIVER: $sessionDriver" -ForegroundColor White
Write-Host "  SESSION_DOMAIN: $sessionDomain" -ForegroundColor White 
Write-Host "  SESSION_LIFETIME: $sessionLifetime" -ForegroundColor White

# Check if session driver is file and verify directory permissions
if ($sessionDriver -eq "file") {
    Write-Host "`n  Checking session storage directory..." -ForegroundColor White
    $sessionPath = "storage/framework/sessions"
    
    if (Test-Path $sessionPath) {
        # Clear old session files
        Write-Host "  Removing old session files..." -ForegroundColor White
        Remove-Item "$sessionPath/*" -Force
        
        # Ensure directory is writable
        Write-Host "  Making session directory writable..." -ForegroundColor White
        icacls "$sessionPath" /grant "Everyone:(OI)(CI)F" /T
    } else {
        Write-Host "  Session directory not found! Creating it..." -ForegroundColor Red
        New-Item -ItemType Directory -Path $sessionPath -Force
        icacls "$sessionPath" /grant "Everyone:(OI)(CI)F" /T
    }
}

# Step 3: Test CSRF token generation
Write-Host "`nStep 3: Testing CSRF token generation..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:8000/check-csrf" -Method Get -ErrorAction SilentlyContinue
if ($response) {
    Write-Host "CSRF Check Response: $($response | ConvertTo-Json -Depth 1)" -ForegroundColor White
} else {
    Write-Host "Could not connect to http://localhost:8000/check-csrf. Is your development server running?" -ForegroundColor Red
}

# Step 4: Verify or fix CORS settings
Write-Host "`nStep 4: Checking CORS settings..." -ForegroundColor Yellow
$corsPath = "app/Http/Middleware/HandleCors.php"
if (Test-Path $corsPath) {
    Write-Host "CORS middleware exists. Good." -ForegroundColor Green
} else {
    Write-Host "CORS middleware not found. Installing Laravel CORS package..." -ForegroundColor Yellow
    composer require fruitcake/laravel-cors
    php artisan vendor:publish --provider="Fruitcake\Cors\CorsServiceProvider"
}

# Step 5: Rebuild config and key
Write-Host "`nStep 5: Rebuilding configuration..." -ForegroundColor Yellow
php artisan optimize:clear
php artisan key:generate --force
php artisan config:cache

# Step 6: Clean browser data instructions and storage verification
Write-Host "`nStep 6: Browser data cleaning instructions" -ForegroundColor Yellow
Write-Host "Please follow these steps manually in your browser:" -ForegroundColor White
Write-Host " 1. Open Developer Tools (F12)" -ForegroundColor White
Write-Host " 2. Go to Application tab" -ForegroundColor White
Write-Host " 3. Clear Cookies, LocalStorage, and SessionStorage for your app domain" -ForegroundColor White
Write-Host " 4. Reload the page" -ForegroundColor White

# Step 7: File permissions check for Laravel
Write-Host "`nStep 7: Verifying key Laravel directory permissions..." -ForegroundColor Yellow
$criticalDirs = @(
    "storage/framework",
    "storage/logs",
    "bootstrap/cache"
)

foreach ($dir in $criticalDirs) {
    if (Test-Path $dir) {
        Write-Host "  Setting permissions for $dir" -ForegroundColor White
        icacls "$dir" /grant "Everyone:(OI)(CI)F" /T
    } else {
        Write-Host "  Directory $dir not found! Creating it..." -ForegroundColor Red
        New-Item -ItemType Directory -Path $dir -Force
        icacls "$dir" /grant "Everyone:(OI)(CI)F" /T
    }
}

# Step 8: Start Laravel server with secure options if needed
Write-Host "`nStep 8: Server options" -ForegroundColor Yellow
Write-Host "If you continue to have issues, try starting your Laravel server with:" -ForegroundColor White
Write-Host "  php artisan serve --port=8000" -ForegroundColor White

Write-Host "`nDiagnostic and fix process complete!" -ForegroundColor Green
Write-Host "Try logging in again. If you still get a 419 error:" -ForegroundColor White
Write-Host " 1. Check browser console for any JavaScript errors" -ForegroundColor White
Write-Host " 2. Verify that SESSION_DOMAIN in .env matches your actual domain" -ForegroundColor White
Write-Host " 3. Make sure your application is using HTTPS consistently" -ForegroundColor White
Write-Host " 4. Try clearing browser cache completely, or test in an incognito window" -ForegroundColor White 