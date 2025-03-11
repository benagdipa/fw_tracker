# 4G Tracker Import Templates

This directory contains template files for importing data into the 4G Tracker application.

## Available Templates

1. `implementation_template.csv` - Template for importing implementation data
2. `wntd_template.csv` - Template for importing WNTD (Wireless Network Test Device) data
3. `ran_parameters_template.csv` - Template for importing RAN Configuration parameters

## Template Descriptions

### Implementation Template
- **Required Fields:**
  - `site_name`: Name of the implementation site
  - `category`: Category of the implementation
  - `status`: Current status of the implementation

### WNTD Template
- **Required Fields:**
  - `site_name`: Name of the site where WNTD is deployed
  - `loc_id`: Location identifier
  - `wntd`: WNTD identifier
  - `imsi`: International Mobile Subscriber Identity
  - `status`: Current status of the WNTD

- **Optional Fields:**
  - `version`: Software version
  - `avc`: AVC information
  - `bw_profile`: Bandwidth profile
  - `lon`: Longitude (decimal format)
  - `lat`: Latitude (decimal format)
  - `home_cell`: Home cell identifier
  - `home_pci`: Physical Cell ID
  - `remarks`: Additional notes
  - `start_date`: Start date (YYYY-MM-DD format)
  - `end_date`: End date (YYYY-MM-DD format)
  - `solution_type`: Type of solution
  - `artefacts`: Additional files or documents (JSON array)

### RAN Configuration Template
- **Required Fields:**
  - `parameter_id`: Unique identifier for the parameter
  - `parameter_name`: Name of the parameter
  - `parameter_value`: Value of the parameter
  - `status`: Current status of the parameter

- **Optional Fields:**
  - `description`: Detailed description of the parameter
  - `domain`: Parameter domain
  - `data_type`: Data type (integer, string, boolean, etc.)
  - `value_range`: Valid range of values
  - `mo_reference`: Managed Object reference
  - `default_value`: Default parameter value
  - `category`: Parameter category
  - `technology`: Technology (e.g., 4G/LTE)
  - `vendor`: Equipment vendor
  - `applicability`: Where the parameter can be applied
  - `type`: Parameter type (parameter/struct)
  - `value`: Current value
  - `unit`: Unit of measurement

## Usage Instructions

1. Download the appropriate template file for your data type.
2. Open the template in a spreadsheet application (Excel, Google Sheets, etc.).
3. Fill in the required fields and any optional fields as needed.
4. Save the file in CSV format.
5. Use the import function in the 4G Tracker application to upload your data.

## Important Notes

- Do not modify the column headers in the templates
- Ensure dates are in YYYY-MM-DD format
- For the WNTD template:
  - Coordinates (lon/lat) should be in decimal format
  - Status values should be one of: active, inactive, pending
  - Artefacts should be a valid JSON array
- For the RAN Configuration template:
  - Parameter IDs must be unique
  - Status values should be one of: active, inactive, deprecated
  - Data types should match the specified type in the template 