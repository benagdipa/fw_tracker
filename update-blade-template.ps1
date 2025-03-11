Write-Host "Updating blade template to use local fonts" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Path to app.blade.php
$bladeFile = "resources/views/app.blade.php"

# Check if file exists
if (-not (Test-Path $bladeFile)) {
    Write-Host "Error: $bladeFile not found" -ForegroundColor Red
    exit 1
}

Write-Host "Reading current blade template..." -ForegroundColor Yellow
$content = Get-Content -Path $bladeFile -Raw

# Make a backup
$backupFile = "$bladeFile.bak"
Copy-Item -Path $bladeFile -Destination $backupFile -Force
Write-Host "Backup created: $backupFile" -ForegroundColor Green

# Remove Google Fonts lines and add local fonts CSS
$newContent = $content -replace '<link rel="preconnect" href="https://fonts.googleapis.com">\s*<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\s*<link href="https://fonts.googleapis.com/css2\?family=Inter:wght@100\.\.900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">', '<!-- Local fonts - no tracking prevention issues -->'

# Add Vite CSS import for local fonts - add after @vite line
if ($newContent -match '@vite\(\[''resources/js/app.jsx'', "resources/js/Pages/\{\$page\[''component''\]\}.jsx"\]\)') {
    $replacement = '@vite([''resources/js/app.jsx'', ''resources/css/local-fonts.css'', "resources/js/Pages/{$page[''component'']}.jsx"])'
    $newContent = $newContent -replace '@vite\(\[''resources/js/app.jsx'', "resources/js/Pages/\{\$page\[''component''\]\}.jsx"\]\)', $replacement
}

# Save the updated content
$newContent | Out-File -FilePath $bladeFile -Encoding utf8
Write-Host "Updated $bladeFile to use local fonts" -ForegroundColor Green

# Now update vite.config.js to include the CSS file
$viteConfigFile = "vite.config.js"
if (Test-Path $viteConfigFile) {
    Write-Host "Updating Vite configuration..." -ForegroundColor Yellow
    $viteConfig = Get-Content -Path $viteConfigFile -Raw
    
    # Check if the input section already includes CSS
    if ($viteConfig -match "input: \[") {
        # If input is an array, check if it includes local-fonts.css
        if (-not ($viteConfig -match "'resources/css/local-fonts.css'")) {
            # Add local-fonts.css to the input array
            $viteConfig = $viteConfig -replace "input: \[", "input: [
            'resources/css/local-fonts.css',"
        }
    } else {
        # If input is a single string, convert to array and add local-fonts.css
        $viteConfig = $viteConfig -replace "input: ['`"]resources/js/app.jsx['`"]", "input: [
            'resources/css/local-fonts.css',
            'resources/js/app.jsx']"
    }
    
    # Save the updated Vite config
    $viteConfig | Out-File -FilePath $viteConfigFile -Encoding utf8
    Write-Host "Updated $viteConfigFile to include local fonts CSS" -ForegroundColor Green
} else {
    Write-Host "Warning: $viteConfigFile not found. Please manually add 'resources/css/local-fonts.css' to your Vite configuration." -ForegroundColor Yellow
}

Write-Host "`nTemplate update complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host " 1. Run the command: php artisan vite:build" -ForegroundColor White
Write-Host " 2. Restart your Laravel application: php artisan serve" -ForegroundColor White 