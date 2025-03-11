# Import Process Enhancements

## Intelligent Duplicate Detection & Update Feature

The 4G Tracker application now includes an enhanced import system with intelligent duplicate detection and record updating. This feature allows users to control whether duplicate records are overwritten, updated, or skipped during import operations.

## Key Features

### Duplicate Detection
- **Smart Key Matching**: The system identifies existing records based on key fields:
  - **Implementation**: `siteName` + `category`
  - **WNTD**: `site_name` + `wntd`
  - **RAN Parameters**: `parameter_id` + `parameter_name`
  - **RAN Structure Parameters**: `parameter_name` + `mo_class_name`

### Update Options
- **User-Controlled Updates**: A new checkbox in the import modal allows users to choose whether to:
  - Update existing records (default behavior)
  - Skip existing records and only import new ones

### Data Integrity
- **Tracking Changes**: All updates to existing records are tracked in the history/audit tables
- **Smart Field Updates**: Only changed fields are updated in existing records
- **Validation**: Field validation is performed before any update or insert

## How to Use

1. **Prepare Import File**: Create a CSV or Excel file with your data (templates available for download)
2. **Upload File**: Click the import button and select your file
3. **Map Columns**: Match your file's columns to database fields (intelligent auto-mapping is available)
4. **Control Duplicate Handling**: 
   - Check "Update existing records if found" to update existing records
   - Uncheck this option to skip existing records and only import new ones
5. **Import**: Click the import button to process your file

## Technical Details

This enhancement improves the import process by:

1. Checking if records with matching key fields already exist in the database
2. Providing user control over whether existing records should be updated
3. Only updating fields that have changed, reducing unnecessary database operations
4. Tracking all changes in the audit/history tables for accountability
5. Maintaining data integrity through comprehensive validation

All three main import services (Implementation, WNTD, and RAN Configuration) have been enhanced with this functionality. 