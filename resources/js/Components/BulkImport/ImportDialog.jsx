import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogHeader, 
  DialogBody, 
  DialogFooter, 
  Button, 
  Alert, 
  Typography, 
  Input, 
  Select, 
  Option, 
  Checkbox,
  Spinner 
} from "@material-tailwind/react";
import axios from "axios";
import toast from "react-hot-toast";

// Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DescriptionIcon from '@mui/icons-material/Description';
import ClearIcon from '@mui/icons-material/Clear';

/**
 * A reusable component for bulk imports with template downloads
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onClose - Function to close the dialog
 * @param {function} onSuccess - Callback function on successful import
 * @param {string} title - Dialog title
 * @param {string} module - Module name (e.g., 'ran-configuration')
 * @param {string} targetTable - Target table for import
 * @param {array} columns - Available columns for mapping
 */
const ImportDialog = ({ 
  open, 
  onClose, 
  onSuccess, 
  title = "Import Data", 
  module,
  targetTable,
  columns = []
}) => {
  // State variables
  const [importFile, setImportFile] = useState(null);
  const [importType, setImportType] = useState('excel');
  const [importInProgress, setImportInProgress] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [columnMappings, setColumnMappings] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const [newColumns, setNewColumns] = useState([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [truncate, setTruncate] = useState(false);
  const [skipHeader, setSkipHeader] = useState(true);

  // Initialize component
  useEffect(() => {
    if (open && columns.length > 0) {
      setAvailableColumns(columns);
      
      // Initialize column mappings
      const initialMappings = {};
      columns.forEach(col => {
        initialMappings[col.value] = col.value;
      });
      setColumnMappings(initialMappings);
    }
  }, [open, columns]);

  // Reset state when dialog is opened
  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open]);

  // Reset state to initial values
  const resetState = () => {
    setImportFile(null);
    setImportType('excel');
    setImportInProgress(false);
    setImportResults(null);
    setNewColumns([]);
    setNewColumnName('');
    setTruncate(false);
    setSkipHeader(true);
  };

  /**
   * Handle file change event
   */
  const handleFileChange = (e) => {
    try {
      const file = e.target.files[0];
      
      // Validate file exists
      if (!file) {
        toast.error("No file selected");
        return;
      }
      
      // Check file type and extension
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const validExtensions = ['csv', 'xlsx', 'xls'];
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error("Invalid file type. Please upload a CSV or Excel file.");
        return;
      }
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        toast.error("File size exceeds the 10MB limit");
        return;
      }
      
      // Update state with the validated file
      setImportFile(file);
      
      // Set import type based on file extension
      if (fileExtension === 'csv') {
        setImportType('csv');
      } else {
        setImportType('excel');
      }
      
      // Clear any previous import results when a new file is selected
      setImportResults(null);
      
      toast.success("File ready for import", {
        duration: 2000,
        style: { background: '#f0f9ff', color: '#0369a1' }
      });
    } catch (error) {
      console.error("Error handling file:", error);
      toast.error("Failed to process file. Please try again.");
    }
  };

  // Handle column mapping change
  const handleMappingChange = (sourceCol, targetCol) => {
    setColumnMappings({
      ...columnMappings,
      [sourceCol]: targetCol
    });
  };

  // Add a new column
  const handleAddNewColumn = () => {
    if (newColumnName.trim() === '') {
      toast.error("Column name cannot be empty");
      return;
    }
    
    const columnExists = newColumns.some(col => col.toLowerCase() === newColumnName.toLowerCase()) ||
                        availableColumns.some(col => col.label.toLowerCase() === newColumnName.toLowerCase());
    
    if (columnExists) {
      toast.error("Column already exists");
      return;
    }
    
    setNewColumns([...newColumns, newColumnName]);
    setNewColumnName('');
  };

  // Remove a new column
  const handleRemoveNewColumn = (columnToRemove) => {
    setNewColumns(newColumns.filter(col => col !== columnToRemove));
  };

  // Download template
  const handleDownloadTemplate = async (format) => {
    try {
      const response = await axios.get(`/api/${module}/download-template/${targetTable}/${format}`, {
        responseType: 'blob'
      });
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${module}_${targetTable}_template.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${format.toUpperCase()} template downloaded successfully`);
    } catch (error) {
      console.error(`Error downloading ${format} template:`, error);
      toast.error(`Failed to download ${format} template`);
    }
  };

  /**
   * Handle the import action
   */
  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }

    setImportInProgress(true);
    const loadingToast = toast.loading("Processing import...");
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('importType', importType);
    formData.append('module', module);
    formData.append('table', targetTable);
    
    // Add the custom mappings if they exist
    if (newColumns.length > 0) {
      formData.append('customMappings', JSON.stringify(newColumns));
    }

    try {
      // Send import request
      const response = await axios.post('/api/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // For files > 1MB show progress
          if (importFile.size > 1024 * 1024) {
            toast.loading(`Uploading: ${percentCompleted}%`, {
              id: loadingToast
            });
          }
        }
      });

      toast.dismiss(loadingToast);
      
      if (response.data.success) {
        // Set import results
        setImportResults({
          success: true,
          totalRows: response.data.totalRows || 0,
          importedRows: response.data.importedRows || 0,
          failedRows: response.data.failedRows || 0,
          errors: response.data.errors || [],
          warnings: response.data.warnings || [],
          message: response.data.message || "Import completed successfully"
        });

        toast.success(response.data.message || "Import completed successfully");
        
        // Call the onSuccess callback with the result data
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(response.data);
        }
      } else {
        // Handle import failure
        setImportResults({
          success: false,
          errors: response.data.errors || ["Unknown error occurred"],
          message: response.data.message || "Import failed"
        });
        
        toast.error(response.data.message || "Import failed");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Import error:", error);
      
      // Detailed error handling based on error type
      let errorMessage = "An error occurred during import";
      
      if (error.response) {
        // Server responded with an error
        errorMessage = error.response.data.message || 
          `Server error: ${error.response.status} ${error.response.statusText}`;
          
        setImportResults({
          success: false,
          errors: error.response.data.errors || [errorMessage],
          message: errorMessage
        });
      } else if (error.request) {
        // No response received
        errorMessage = "No response from server. Please check your network connection.";
        setImportResults({
          success: false,
          errors: [errorMessage],
          message: errorMessage
        });
      } else {
        // Request setup error
        errorMessage = `Request error: ${error.message}`;
        setImportResults({
          success: false,
          errors: [errorMessage],
          message: errorMessage
        });
      }
      
      toast.error(errorMessage);
    } finally {
      setImportInProgress(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    // If import was successful, reset state before closing
    if (importResults && importResults.success) {
      resetState();
    }
    
    // Call the onClose callback
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <Dialog open={open} handler={handleClose} size="lg">
      <DialogHeader className="flex items-center justify-between">
        <div>{title}</div>
        <Button 
          variant="text" 
          color="blue-gray" 
          className="p-2"
          disabled={importInProgress}
          onClick={handleClose}
        >
          <ClearIcon className="h-5 w-5" />
        </Button>
      </DialogHeader>

      <DialogBody divider className="max-h-[70vh] overflow-y-auto">
        {importResults ? (
          <div className="space-y-4">
            <Alert 
              color={importResults.success ? "green" : "red"}
              icon={importResults.success ? <CheckCircleIcon /> : <ErrorIcon />}
              className="mb-4"
            >
              {importResults.message}
            </Alert>
            
            {importResults.success && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <Typography variant="h6">Total Rows</Typography>
                  <Typography variant="h4" className="text-blue-500">{importResults.totalRows}</Typography>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Typography variant="h6">Imported Successfully</Typography>
                  <Typography variant="h4" className="text-green-500">{importResults.importedRows}</Typography>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <Typography variant="h6">Failed Rows</Typography>
                  <Typography variant="h4" className="text-red-500">{importResults.failedRows}</Typography>
                </div>
              </div>
            )}
            
            {importResults.errors && importResults.errors.length > 0 && (
              <div className="mt-4">
                <Typography variant="h6" color="red">Errors</Typography>
                <div className="bg-red-50 p-4 rounded-lg mt-2 max-h-40 overflow-y-auto">
                  <ul className="list-disc pl-5">
                    {importResults.errors.map((error, index) => (
                      <li key={index} className="text-red-700">{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex justify-center">
              <Button 
                onClick={() => {
                  setImportResults(null);
                  setImportFile(null);
                }} 
                color="blue"
              >
                Import Another File
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!importFile ? (
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <DescriptionIcon className="h-16 w-16 text-blue-500" />
                </div>
                <Typography variant="h6" className="mb-2">
                  Select an Excel or CSV file to import
                </Typography>
                <Typography variant="paragraph" color="blue-gray" className="mb-4">
                  Your file should contain headers that can be mapped to the database fields.
                </Typography>
                
                {/* Template download section */}
                <div className="mt-6 mb-4 p-4 bg-gray-50 rounded-lg">
                  <Typography variant="h6" className="mb-2 text-gray-700">
                    Need a template?
                  </Typography>
                  <Typography variant="small" color="blue-gray" className="mb-3">
                    Download a template file for easy data preparation
                  </Typography>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button 
                      variant="outlined" 
                      color="blue" 
                      className="flex items-center gap-2"
                      onClick={() => handleDownloadTemplate('excel')}
                    >
                      <DownloadIcon className="h-4 w-4" /> Excel Template
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="blue-gray" 
                      className="flex items-center gap-2"
                      onClick={() => handleDownloadTemplate('csv')}
                    >
                      <DownloadIcon className="h-4 w-4" /> CSV Template
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <label className="cursor-pointer">
                    <Button 
                      className="flex items-center gap-2"
                      variant="gradient"
                      color="blue"
                      size="lg"
                    >
                      <FileUploadIcon className="h-5 w-5" />
                      Browse Files
                    </Button>
                    <input 
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <Alert color="blue" className="mb-4">
                  <div className="flex items-center gap-3">
                    <DescriptionIcon className="h-5 w-5" />
                    <Typography className="font-medium">
                      Selected file: {importFile.name}
                    </Typography>
                  </div>
                </Alert>
                
                <div className="mb-6">
                  <Typography variant="h6" className="mb-2">Column Mapping</Typography>
                  <Typography color="blue-gray" className="mb-4">
                    Map the columns from your file to the database fields
                  </Typography>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {availableColumns.map((column) => (
                      <div key={column.value} className="flex items-center gap-2">
                        <Typography className="min-w-[150px] text-sm md:text-base">
                          {column.label}:
                        </Typography>
                        <Select
                          value={columnMappings[column.value] || ''}
                          onChange={(value) => handleMappingChange(column.value, value)}
                          className="flex-1"
                          label="Map to"
                        >
                          <Option value="">Ignore this column</Option>
                          {availableColumns.map((targetCol) => (
                            <Option key={targetCol.value} value={targetCol.value}>
                              {targetCol.label}
                            </Option>
                          ))}
                          {newColumns.map((newCol) => (
                            <Option key={newCol} value={newCol}>
                              {newCol} (New)
                            </Option>
                          ))}
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6 border-t pt-4">
                  <Typography variant="h6" className="mb-2">Add New Column</Typography>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      label="New Column Name"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddNewColumn}
                      color="blue"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {newColumns.length > 0 && (
                    <div className="mt-4">
                      <Typography variant="paragraph" className="mb-2">Added Columns:</Typography>
                      <div className="flex flex-wrap gap-2">
                        {newColumns.map((col) => (
                          <div key={col} className="bg-blue-100 text-blue-800 rounded-lg px-3 py-1 flex items-center gap-1">
                            {col}
                            <button 
                              onClick={() => handleRemoveNewColumn(col)}
                              className="text-blue-800 hover:text-red-700"
                            >
                              <ClearIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <Typography variant="h6" className="mb-2">Import Options</Typography>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Checkbox 
                        id="truncate" 
                        checked={truncate}
                        onChange={() => setTruncate(!truncate)}
                      />
                      <label htmlFor="truncate" className="ml-2">
                        Clear existing data before import
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <Checkbox 
                        id="skipHeader" 
                        checked={skipHeader}
                        onChange={() => setSkipHeader(!skipHeader)}
                      />
                      <label htmlFor="skipHeader" className="ml-2">
                        Skip header row
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogBody>
      
      {!importResults && importFile && (
        <DialogFooter className="flex justify-between">
          <div>
            <label className="cursor-pointer">
              <Button
                variant="outlined"
                color="blue-gray"
                className="mr-2"
                disabled={importInProgress}
              >
                Change File
              </Button>
              <input 
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="text"
              color="red"
              onClick={handleClose}
              className="mr-2"
              disabled={importInProgress}
            >
              Cancel
            </Button>
            <Button 
              variant="gradient" 
              color="blue"
              onClick={handleImport}
              disabled={importInProgress}
              className="flex items-center gap-2"
            >
              {importInProgress ? (
                <>
                  <Spinner className="h-4 w-4" /> Importing...
                </>
              ) : (
                <>
                  <FileUploadIcon className="h-4 w-4" /> Import Data
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      )}
    </Dialog>
  );
};

export default ImportDialog; 