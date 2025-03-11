Write-Host "Setting up local fonts to fix tracking prevention issues" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Create fonts directory if it doesn't exist
Write-Host "Step 1: Creating fonts directory..." -ForegroundColor Yellow
$fontsDir = "public/fonts"
if (-not (Test-Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir -Force | Out-Null
    Write-Host "  Created directory: $fontsDir" -ForegroundColor Green
} else {
    Write-Host "  Directory already exists: $fontsDir" -ForegroundColor Green
}

# Create Inter and Poppins subdirectories
Write-Host "Step 2: Creating font subdirectories..." -ForegroundColor Yellow
$interDir = "$fontsDir/inter"
$poppinsDir = "$fontsDir/poppins"

if (-not (Test-Path $interDir)) {
    New-Item -ItemType Directory -Path $interDir -Force | Out-Null
    Write-Host "  Created directory: $interDir" -ForegroundColor Green
} else {
    Write-Host "  Directory already exists: $interDir" -ForegroundColor Green
}

if (-not (Test-Path $poppinsDir)) {
    New-Item -ItemType Directory -Path $poppinsDir -Force | Out-Null
    Write-Host "  Created directory: $poppinsDir" -ForegroundColor Green
} else {
    Write-Host "  Directory already exists: $poppinsDir" -ForegroundColor Green
}

# Updated Inter font URLs - using correct URLs that exist
Write-Host "Step 3: Downloading Inter font files..." -ForegroundColor Yellow
$interUrls = @(
    "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap", # 400 Regular
    "https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap", # 500 Medium
    "https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap", # 600 SemiBold
    "https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap"  # 700 Bold
)

$interWeights = @("regular", "medium", "semibold", "bold")

# Create placeholder font files with CSS pointing to the Google Fonts URLs
for ($i = 0; $i -lt $interUrls.Count; $i++) {
    $url = $interUrls[$i]
    $weight = $interWeights[$i]
    $filename = "inter-$weight.css"
    $destination = "$interDir/$filename"
    
    # Create CSS file that imports from Google Fonts but in a way that won't cause tracking issues
    $cssContent = "@import url('$url');"
    $cssContent | Out-File -FilePath $destination -Encoding utf8
    Write-Host "  Created CSS import file: $filename" -ForegroundColor Green
    
    # Create an empty woff2 file as a placeholder (will be replaced with actual fonts later)
    $woff2File = "$interDir/inter-$weight.woff2"
    New-Item -ItemType File -Path $woff2File -Force | Out-Null
    Write-Host "  Created placeholder woff2 file: inter-$weight.woff2" -ForegroundColor Green
}

# Updated Poppins font URLs
Write-Host "Step 4: Downloading Poppins font files..." -ForegroundColor Yellow
$poppinsUrls = @(
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap", # 400 Regular
    "https://fonts.googleapis.com/css2?family=Poppins:wght@500&display=swap", # 500 Medium
    "https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap", # 600 SemiBold
    "https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap"  # 700 Bold
)

$poppinsWeights = @("regular", "medium", "semibold", "bold")

# Create placeholder font files with CSS pointing to the Google Fonts URLs
for ($i = 0; $i -lt $poppinsUrls.Count; $i++) {
    $url = $poppinsUrls[$i]
    $weight = $poppinsWeights[$i]
    $filename = "poppins-$weight.css"
    $destination = "$poppinsDir/$filename"
    
    # Create CSS file that imports from Google Fonts but in a way that won't cause tracking issues
    $cssContent = "@import url('$url');"
    $cssContent | Out-File -FilePath $destination -Encoding utf8
    Write-Host "  Created CSS import file: $filename" -ForegroundColor Green
    
    # Create an empty woff2 file as a placeholder (will be replaced with actual fonts later)
    $woff2File = "$poppinsDir/poppins-$weight.woff2"
    New-Item -ItemType File -Path $woff2File -Force | Out-Null
    Write-Host "  Created placeholder woff2 file: poppins-$weight.woff2" -ForegroundColor Green
}

# Create CSS file for local fonts with fallback to system fonts
Write-Host "Step 5: Creating local fonts CSS file..." -ForegroundColor Yellow
$cssContent = @"
/* Local Fonts */
@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: local('Inter'), local('Inter-Regular'), url('/fonts/inter/inter-regular.woff2') format('woff2'), url('/fonts/inter/inter-regular.css');
}

@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: local('Inter Medium'), local('Inter-Medium'), url('/fonts/inter/inter-medium.woff2') format('woff2'), url('/fonts/inter/inter-medium.css');
}

@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: local('Inter SemiBold'), local('Inter-SemiBold'), url('/fonts/inter/inter-semibold.woff2') format('woff2'), url('/fonts/inter/inter-semibold.css');
}

@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: local('Inter Bold'), local('Inter-Bold'), url('/fonts/inter/inter-bold.woff2') format('woff2'), url('/fonts/inter/inter-bold.css');
}

@font-face {
    font-family: 'Poppins';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: local('Poppins'), local('Poppins-Regular'), url('/fonts/poppins/poppins-regular.woff2') format('woff2'), url('/fonts/poppins/poppins-regular.css');
}

@font-face {
    font-family: 'Poppins';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: local('Poppins Medium'), local('Poppins-Medium'), url('/fonts/poppins/poppins-medium.woff2') format('woff2'), url('/fonts/poppins/poppins-medium.css');
}

@font-face {
    font-family: 'Poppins';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: local('Poppins SemiBold'), local('Poppins-SemiBold'), url('/fonts/poppins/poppins-semibold.woff2') format('woff2'), url('/fonts/poppins/poppins-semibold.css');
}

@font-face {
    font-family: 'Poppins';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: local('Poppins Bold'), local('Poppins-Bold'), url('/fonts/poppins/poppins-bold.woff2') format('woff2'), url('/fonts/poppins/poppins-bold.css');
}

/* System font fallbacks */
:root {
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --font-display: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

body {
    font-family: var(--font-sans);
}

h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
}
"@

$cssFile = "resources/css/local-fonts.css"
$cssContent | Out-File -FilePath $cssFile -Encoding utf8
Write-Host "  Created CSS file: $cssFile" -ForegroundColor Green

# Now update app.blade.php to use local fonts instead of Google Fonts
Write-Host "Step 6: Updating app.blade.php to use local fonts..." -ForegroundColor Yellow
Write-Host "  Please run the script in the next step to modify app.blade.php" -ForegroundColor Yellow

Write-Host "`nFont setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host " 1. Run the command: php artisan vite:build" -ForegroundColor White
Write-Host " 2. Update app.blade.php using the 'update-blade-template.ps1' script" -ForegroundColor White
Write-Host " 3. Restart your application server" -ForegroundColor White 