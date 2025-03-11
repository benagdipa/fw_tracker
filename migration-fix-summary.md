# Laravel Migration Fixes

## Problem
Laravel migrations can fail in certain scenarios, particularly:
1. When the same migration is attempted to be run multiple times
2. When migrations try to create tables or columns that already exist
3. When specific migrations like `create_permission_tables` have complex dependencies

## Solution Provided

### Fix for Individual Migrations

#### 1. Fix for "sslrequired" Column Issue
We modified the migration to add existence checks:
```php
if (!Schema::hasColumn('import_d_b_s', 'sslrequired')) {
    $table->boolean('sslrequired')->default(false);
}
```

#### 2. Fix for Permission Tables Migration
The permission tables migration is more complex. We've implemented specific fixes:
- Added checks at the beginning to skip if all tables exist
- Added table existence checks before creating each table
- Added checks before creating foreign keys to ensure referenced tables exist

### Comprehensive Fix for All Migrations

We've created two PowerShell scripts to make all migrations safer:

#### 1. `fix_all_migrations.ps1`
This script:
- Automatically adds existence checks to all migrations
- Modifies table creation operations to check if tables exist first
- Modifies column addition operations to check if columns exist first
- Creates a recovery script for handling failed migrations

#### 2. `fix_permission_migration.ps1`
This script specifically focuses on fixing the permission tables migration, which has been reported as problematic.

#### 3. `recover_migrations.ps1`
This script is created by `fix_all_migrations.ps1` and helps in recovering from failed migrations by:
- Detecting failed migrations
- Offering options to mark them as complete without running them
- Allowing running migrations one by one to isolate problems

## How to Use

### For New Developers Setting Up the Project
1. Run `.\fix_all_migrations.ps1` before attempting to run migrations
2. Run normal migrations: `php artisan migrate`
3. If any migrations still fail, run `.\recover_migrations.ps1`

### For Specific Permission Tables Issues
If only the permission tables migration is failing:
1. Run `.\fix_permission_migration.ps1`

## Why This Works
These fixes make migrations more resilient by:
1. Preventing attempts to create tables or columns that already exist
2. Providing a mechanism to recover from failed migrations
3. Adding specific handling for complex migrations like permission tables

This approach ensures that migrations can be run safely in any environment, regardless of the previous state of the database. 