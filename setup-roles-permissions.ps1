# Setup Roles and Permissions Script for Windows

Write-Host "Setting up roles and permissions for the application..." -ForegroundColor Cyan

# Check if user wants to run migrations fresh
$runFresh = Read-Host "Do you want to run fresh migrations? This will erase all data! (y/N)"

if ($runFresh -eq "y" -or $runFresh -eq "Y") {
    Write-Host "Running fresh migrations..." -ForegroundColor Yellow
    php artisan setup:roles-permissions --fresh
}
else {
    Write-Host "Running setup without fresh migrations..." -ForegroundColor Green
    php artisan setup:roles-permissions
}

Write-Host "Setup completed!" -ForegroundColor Cyan
Write-Host "Protected admin account credentials:" -ForegroundColor Green
Write-Host "Email: admin@4gtracker.com" -ForegroundColor White
Write-Host "Password: Admin4G$ecure!" -ForegroundColor White
Write-Host "IMPORTANT: This is a protected account that cannot have its super-admin role removed!" -ForegroundColor Red

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 