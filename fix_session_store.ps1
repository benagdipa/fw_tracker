Write-Host "Laravel Session Store Repair Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clear session files
Write-Host "Step 1: Clearing all session files..." -ForegroundColor Yellow
$sessionPath = "storage/framework/sessions"
    
if (Test-Path $sessionPath) {
    # Clear all session files
    Write-Host "  Removing session files..." -ForegroundColor White
    Remove-Item "$sessionPath/*" -Force -ErrorAction SilentlyContinue
    
    # Ensure directory is writable
    Write-Host "  Setting permissions..." -ForegroundColor White
    icacls "$sessionPath" /grant "Everyone:(OI)(CI)F" /T
    
    Write-Host "  Session storage cleared successfully." -ForegroundColor Green
} else {
    Write-Host "  Session directory not found! Creating it..." -ForegroundColor Red
    New-Item -ItemType Directory -Path $sessionPath -Force
    icacls "$sessionPath" /grant "Everyone:(OI)(CI)F" /T
}

# Step 2: Add/update CORS headers
Write-Host "`nStep 2: Setting up CORS headers..." -ForegroundColor Yellow
$corsMiddlewarePath = "app/Http/Middleware/AddCorsHeaders.php"

# Only create if it doesn't exist
if (-not (Test-Path $corsMiddlewarePath)) {
    Write-Host "  Creating CORS middleware..." -ForegroundColor White
    
    $corsMiddlewareContent = @"
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AddCorsHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  \$request
     * @param  \Closure  \$next
     * @return mixed
     */
    public function handle(Request \$request, Closure \$next)
    {
        \$response = \$next(\$request);
        
        // Don't add headers if already added by another middleware
        if (!\$response->headers->has('Access-Control-Allow-Origin')) {
            \$response->header('Access-Control-Allow-Origin', \$request->header('Origin') ? \$request->header('Origin') : '*');
            \$response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            \$response->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-TOKEN, X-XSRF-TOKEN');
            \$response->header('Access-Control-Allow-Credentials', 'true');
            \$response->header('Access-Control-Max-Age', '86400');
        }
        
        return \$response;
    }
}
"@
    
    # Create the middleware file
    New-Item -Path $corsMiddlewarePath -ItemType File -Force | Out-Null
    Set-Content -Path $corsMiddlewarePath -Value $corsMiddlewareContent
    
    Write-Host "  CORS middleware created successfully." -ForegroundColor Green
    
    # Now register the middleware in Kernel.php
    $kernelPath = "app/Http/Kernel.php"
    
    if (Test-Path $kernelPath) {
        Write-Host "  Registering middleware in Kernel.php..." -ForegroundColor White
        $kernelContent = Get-Content -Path $kernelPath -Raw
        
        # Check if the middleware is already registered
        if ($kernelContent -match "AddCorsHeaders") {
            Write-Host "  Middleware already registered." -ForegroundColor Green
        } else {
            # Get the middleware groups section and add our middleware
            $webMiddlewarePattern = "(?ms)'web'\s*=>\s*\[(.*?)\]"
            if ($kernelContent -match $webMiddlewarePattern) {
                $webMiddleware = $Matches[1]
                $updatedWebMiddleware = $webMiddleware.Trim() + "`n        \App\Http\Middleware\AddCorsHeaders::class,`n    "
                $kernelContent = $kernelContent -replace $webMiddlewarePattern, "'web' => [`$1]"
                $kernelContent = $kernelContent -replace $webMiddleware, $updatedWebMiddleware
                
                Set-Content -Path $kernelPath -Value $kernelContent
                Write-Host "  Middleware registered successfully." -ForegroundColor Green
            } else {
                Write-Host "  Could not find web middleware group in Kernel.php." -ForegroundColor Red
                Write-Host "  Please manually add 'App\Http\Middleware\AddCorsHeaders::class' to the web middleware group in $kernelPath" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  Kernel.php not found at $kernelPath." -ForegroundColor Red
    }
} else {
    Write-Host "  CORS middleware already exists." -ForegroundColor Green
}

# Step 3: Update .env file with proper session config
Write-Host "`nStep 3: Checking session configuration in .env..." -ForegroundColor Yellow
$envPath = ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content -Path $envPath -Raw
    
    # Check session driver
    if ($envContent -match "SESSION_DRIVER=file") {
        Write-Host "  SESSION_DRIVER is correctly set to file." -ForegroundColor Green
    } else {
        Write-Host "  Updating SESSION_DRIVER to file..." -ForegroundColor White
        $envContent = $envContent -replace "SESSION_DRIVER=(.*)", "SESSION_DRIVER=file"
        Set-Content -Path $envPath -Value $envContent
    }
    
    # Ensure SESSION_LIFETIME is appropriate
    if ($envContent -match "SESSION_LIFETIME=(\d+)") {
        $lifetime = [int]$Matches[1]
        if ($lifetime -lt 120) {
            Write-Host "  Increasing SESSION_LIFETIME to 120 minutes for better user experience..." -ForegroundColor White
            $envContent = $envContent -replace "SESSION_LIFETIME=(\d+)", "SESSION_LIFETIME=120"
            Set-Content -Path $envPath -Value $envContent
        } else {
            Write-Host "  SESSION_LIFETIME is good (${lifetime} minutes)." -ForegroundColor Green
        }
    }
    
    # Make sure CSRF_COOKIE and SESSION_DOMAIN are set correctly
    $appUrl = ""
    if ($envContent -match "APP_URL=(.*)") {
        $appUrl = $Matches[1].Trim()
    }
    
    if ($appUrl -and $appUrl -match "^https?://([^/:]+)") {
        $domain = $Matches[1]
        
        # Check and set SESSION_DOMAIN if needed
        if (-not ($envContent -match "SESSION_DOMAIN=${domain}")) {
            Write-Host "  Setting SESSION_DOMAIN to '$domain' (from APP_URL)..." -ForegroundColor White
            if ($envContent -match "SESSION_DOMAIN=") {
                $envContent = $envContent -replace "SESSION_DOMAIN=(.*)", "SESSION_DOMAIN=${domain}"
            } else {
                $envContent += "`nSESSION_DOMAIN=${domain}"
            }
            Set-Content -Path $envPath -Value $envContent
        } else {
            Write-Host "  SESSION_DOMAIN is correctly set." -ForegroundColor Green
        }
    } else {
        Write-Host "  Could not determine domain from APP_URL. Please manually set SESSION_DOMAIN in .env if needed." -ForegroundColor Yellow
    }
    
} else {
    Write-Host "  .env file not found!" -ForegroundColor Red
}

# Step 4: Clear caches and restart app
Write-Host "`nStep 4: Clearing caches..." -ForegroundColor Yellow
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
php artisan optimize:clear

Write-Host "`nSession Store Repair Complete!" -ForegroundColor Green
Write-Host "Please restart your application server." -ForegroundColor White
Write-Host "If you're still experiencing problems, try the following:" -ForegroundColor White
Write-Host " 1. Clear your browser cache and cookies" -ForegroundColor White
Write-Host " 2. Use a private/incognito window" -ForegroundColor White
Write-Host " 3. Try a different browser" -ForegroundColor White
Write-Host " 4. Check browser console for any remaining errors" -ForegroundColor White 