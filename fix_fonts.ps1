Write-Host "Font Fix Script" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""

$fontDir = "public/fonts/inter"

# Check if font directory exists, create if not
if (-not (Test-Path $fontDir)) {
    Write-Host "Creating font directory: $fontDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $fontDir -Force | Out-Null
}

# Font weights and filenames
$fonts = @(
    @{
        name = "regular";
        weight = "400";
        url = "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
    },
    @{
        name = "medium";
        weight = "500";
        url = "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
    },
    @{
        name = "semibold";
        weight = "600";
        url = "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
    },
    @{
        name = "bold";
        weight = "700";
        url = "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
    }
)

foreach ($font in $fonts) {
    $destPath = "$fontDir/inter-$($font.name).woff2"
    $destCss = "$fontDir/inter-$($font.name).css"
    
    # Download font file
    Write-Host "Downloading $($font.url) to $destPath" -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri $font.url -OutFile $destPath
        Write-Host "  - Downloaded successfully" -ForegroundColor Green
        
        # Create the CSS file
        $css = @"
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: $($font.weight);
  font-display: swap;
  src: url('./inter-$($font.name).woff2') format('woff2');
}
"@
        Set-Content -Path $destCss -Value $css -Force
        Write-Host "  - Created CSS file: $destCss" -ForegroundColor Green
    }
    catch {
        Write-Host "  - Error downloading font: $_" -ForegroundColor Red
        
        # Create a fallback CSS
        $fallbackCss = @"
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: $($font.weight);
  font-display: swap;
  src: local('Arial');
}
"@
        Set-Content -Path $destCss -Value $fallbackCss -Force
        Write-Host "  - Created fallback CSS with system font" -ForegroundColor Yellow
    }
}

Write-Host "`nAdditionally, let's update the CSS import path" -ForegroundColor Yellow
$cssPath = "resources/css/local-fonts.css"

if (Test-Path $cssPath) {
    $cssContent = Get-Content -Path $cssPath -Raw
    
    # Check if the content needs to be fixed
    if ($cssContent -match "/fonts/inter/") {
        # No need to modify
        Write-Host "CSS path looks correct" -ForegroundColor Green
    } else {
        # Update the path to reference the fonts correctly
        $newCssContent = $cssContent -replace "url\(['`"]?([^'`")]+)['`"]?\)", "url('/fonts/inter/`$1')"
        Set-Content -Path $cssPath -Value $newCssContent -Force
        Write-Host "Updated CSS paths in $cssPath" -ForegroundColor Green
    }
} else {
    Write-Host "CSS file not found at $cssPath - creating it" -ForegroundColor Yellow
    
    $newCss = @"
/* Inter font imports */
@import url('/fonts/inter/inter-regular.css');
@import url('/fonts/inter/inter-medium.css');
@import url('/fonts/inter/inter-semibold.css');
@import url('/fonts/inter/inter-bold.css');
"@
    
    Set-Content -Path $cssPath -Value $newCss -Force
    Write-Host "Created CSS file with correct imports" -ForegroundColor Green
}

Write-Host "`nFont fix completed!" -ForegroundColor Green
Write-Host "Please restart your development server to apply changes." -ForegroundColor White 