$content = Get-Content -Path config/database.php -Raw
$content = $content -replace "'search_path' => 'public',", "'search_path' => env('DB_SEARCH_PATH', 'public'),"
