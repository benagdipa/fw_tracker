# 4G Tracker

A comprehensive web application for tracking 4G/5G network implementation, WNTD records, and RAN configurations.

## Overview

4G Tracker is a Laravel-based application designed to help network engineers and administrators manage and monitor various aspects of cellular network deployment. The application provides tools for tracking implementation progress, managing WNTD (Wireless Network Technical Data) records, and handling RAN (Radio Access Network) configurations.

## Features

### Implementation Tracking
- Track site implementation status across different categories
- Monitor progress with customizable statuses (done, in_progress, delayed, etc.)
- Record implementation details including site name, eNB/gNB identifiers, implementors
- Store technical information such as ENM scripts, SP scripts, CRQ numbers
- Manage geographic data (address, latitude, longitude)

### WNTD Management
- Store and track Wireless Network Technical Data
- Record site details, WNTD identifiers, IMSI numbers
- Manage version information, AVC details, and bandwidth profiles
- Track geographical coordinates, home cells, and PCI information
- Monitor implementation status with start/end dates

### RAN Configuration
- Manage RAN parameter configurations
- Track parameter settings across different technologies
- Store structure parameters with MO class details
- Support for parameter mappings and relationships
- Track parameter history and changes

### Data Import/Export
- Import data from CSV and Excel files with intelligent field mapping
- Export data to various formats (CSV, Excel, PDF)
- Intelligent duplicate detection with user-controlled update options
- Template generation for standardized data import

### Other Features
- Role-based access control (super-admin, admin, editor, user)
- Audit logging for all operations
- Bulk operations for efficient data management
- Advanced filtering and searching capabilities
- Responsive UI built with React and Material-UI

## Installation

### Prerequisites
- PHP 8.0 or higher
- Composer
- Node.js and NPM
- MySQL or PostgreSQL database
- Web server (Apache, Nginx)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/4G_tracker.git
   cd 4G_tracker
   ```

2. Install PHP dependencies:
   ```bash
   composer install
   ```

3. Install JavaScript dependencies:
   ```bash
   npm install
   ```

4. Copy environment file and configure your database:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file to set your database connection details and other configuration.

5. Generate application key:
   ```bash
   php artisan key:generate
   ```

6. Run database migrations and seed initial data:
   ```bash
   php artisan migrate --seed
   ```

7. Build frontend assets:
   ```bash
   npm run build
   ```

8. Start the development server:
   ```bash
   php artisan serve
   ```

## Usage

### Implementation Management

1. **View Implementation Records**: Navigate to the Implementation section to view all implementation records in a data grid.

2. **Add New Implementation**: Click the "Add" button and fill in the required fields in the form.

3. **Import Data**: Use the import functionality to bulk import implementation data.
   - Click "Import" and select your CSV/Excel file
   - Map the columns in your file to the database fields
   - Choose whether to update existing records (if duplicates are found)
   - Review and confirm the import

4. **Export Data**: Use the export functionality to download implementation data in various formats.

### WNTD Management

1. **View WNTD Records**: Access the WNTD section to view and manage all WNTD records.

2. **Add New WNTD**: Click "Add" to create a new WNTD record with site information, technical details, and status.

3. **Import/Export**: Similar to Implementation, use the import/export features to manage bulk data operations.

### RAN Configuration

1. **Manage Parameters**: Navigate to the RAN Configuration section to view and edit parameters.

2. **Structure Parameters**: Access the structure parameters section to manage MO class definitions.

3. **Parameter Mappings**: Use the parameter mappings feature to define relationships between parameters.

4. **Bulk Updates**: Select multiple parameters to update them simultaneously.

## Configuration

### Environment Variables

Key environment variables that can be configured in the `.env` file:

- `APP_NAME`: Application name
- `APP_ENV`: Application environment (local, staging, production)
- `APP_DEBUG`: Enable/disable debug mode
- `DB_CONNECTION`: Database connection type
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`: Database connection details
- `QUEUE_CONNECTION`: Queue connection for background jobs

### User Roles

The application supports the following roles, each with different permissions:

- **Super Admin**: Full access to all features and administrative functions
- **Admin**: Can manage all data but cannot modify system settings
- **Editor**: Can add, edit, and delete records but cannot perform administrative tasks
- **User**: Read access with limited write permissions

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify your database credentials in the `.env` file
   - Ensure your database server is running
   - Check network connectivity to the database server

2. **Import Failures**:
   - Validate your import file format against the templates
   - Check that required fields are properly mapped
   - Review error messages in the application logs

3. **Performance Issues**:
   - Enable caching for improved performance
   - Consider optimizing database queries for large datasets
   - Use pagination for viewing large record sets

### Logging

Application logs are stored in the `storage/logs` directory. Check these logs for detailed error information when troubleshooting issues.

## Additional Resources

- [Import Process Documentation](docs/import_enhancements.md) - Detailed information about the import process and features
- [API Documentation](docs/api.md) - Information about the application's API endpoints
- [Database Schema](docs/schema.md) - Overview of the database structure

## License

This application is proprietary software. Unauthorized copying, modification, distribution, or use is prohibited.

## Support

For support inquiries, please contact your system administrator or IT support team. 