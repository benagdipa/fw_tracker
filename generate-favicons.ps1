# PowerShell script to generate favicons from the logo
# Requires ImageMagick to be installed

Write-Host "Generating favicon files from logo..." -ForegroundColor Cyan

# Source logo
$logoPath = "public\images\4g-logo.png"
$faviconDir = "public\images\favicon"

# Ensure favicon directory exists
if (-not (Test-Path $faviconDir)) {
    New-Item -ItemType Directory -Path $faviconDir -Force | Out-Null
    Write-Host "Created favicon directory at $faviconDir" -ForegroundColor Green
}

# Copy original logo for reference
Copy-Item -Path $logoPath -Destination "$faviconDir\original-logo.png" -Force
Write-Host "Copied original logo to $faviconDir\original-logo.png" -ForegroundColor Green

# Define favicon sizes to generate
$favSizes = @(
    @{name="favicon-16x16.png"; size="16x16"},
    @{name="favicon-32x32.png"; size="32x32"},
    @{name="apple-touch-icon.png"; size="180x180"}
)

# Check if ImageMagick is installed
$hasMagick = $null -ne (Get-Command "magick" -ErrorAction SilentlyContinue)

if ($hasMagick) {
    # Generate different favicon sizes using ImageMagick
    foreach ($fav in $favSizes) {
        Write-Host "Generating $($fav.name) ($($fav.size))..." -ForegroundColor Yellow
        magick convert $logoPath -resize $fav.size -background transparent "$faviconDir\$($fav.name)"
    }
    
    # Generate favicon.ico (16x16, 32x32, 48x48)
    Write-Host "Generating favicon.ico..." -ForegroundColor Yellow
    magick convert $logoPath -define icon:auto-resize=16,32,48 "public\favicon.ico"
    
    Write-Host "All favicon files generated successfully!" -ForegroundColor Green
} else {
    # Manual copy method if ImageMagick is not available
    Write-Host "ImageMagick not found. Copying the logo as-is to favicon locations..." -ForegroundColor Yellow
    Copy-Item -Path $logoPath -Destination "public\favicon.ico" -Force
    Copy-Item -Path $logoPath -Destination "$faviconDir\favicon-16x16.png" -Force
    Copy-Item -Path $logoPath -Destination "$faviconDir\favicon-32x32.png" -Force
    Copy-Item -Path $logoPath -Destination "$faviconDir\apple-touch-icon.png" -Force
    
    Write-Host "Logo files copied, but not resized. Install ImageMagick for proper resizing." -ForegroundColor Yellow
}

# Create a basic webmanifest file
$webmanifest = @"
{
    "name": "4G Tracker",
    "short_name": "4G Tracker",
    "icons": [
        {
            "src": "/images/favicon/favicon-16x16.png",
            "sizes": "16x16",
            "type": "image/png"
        },
        {
            "src": "/images/favicon/favicon-32x32.png",
            "sizes": "32x32",
            "type": "image/png"
        },
        {
            "src": "/images/favicon/apple-touch-icon.png",
            "sizes": "180x180",
            "type": "image/png"
        }
    ],
    "theme_color": "#ffffff",
    "background_color": "#ffffff",
    "display": "standalone"
}
"@

$webmanifest | Out-File -FilePath "$faviconDir\site.webmanifest" -Encoding utf8
Write-Host "Created site.webmanifest file" -ForegroundColor Green

Write-Host "Favicon generation complete!" -ForegroundColor Cyan 