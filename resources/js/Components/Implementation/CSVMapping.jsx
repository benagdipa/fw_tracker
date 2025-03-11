import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Typography,
  Select,
  Option,
  Spinner,
  Chip,
  Progress,
  Alert
} from "@material-tailwind/react";
import { router } from "@inertiajs/react";
import toast from "react-hot-toast";
import axios from "axios";
import { FileUpIcon, InfoIcon, CheckCircleIcon, HelpCircleIcon } from "lucide-react";

export default function CSVMapping({ onChange, tableName = "implementation-tracker", typeOfData = ["date", "boolean", "number", "string"] }) {
  // State management
  const [open, setOpen] = useState(false);
  const [mappings, setMappings] = useState({});
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState(null);
  const [requiredFields] = useState(['site_name', 'solution_type']);
  const [importStatus, setImportStatus] = useState(null); // 'success', 'error', 'loading'
  const [importMessage, setImportMessage] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const fileInputRef = useRef(null);

  // Field definitions with descriptions for better UI
  const fieldDefinitions = {
    'site_name': { label: 'Site Name', description: 'Name of the site', required: true },
    'solution_type': { label: 'Solution Type', description: 'Type of solution implemented', required: true },
    'site_id': { label: 'Site ID', description: 'Unique site identifier' },
    'type': { label: 'Type', description: 'Implementation type' },
    'status': { label: 'Status', description: 'Current implementation status' },
    'start_date': { label: 'Start Date', description: 'Implementation start date' },
    'end_date': { label: 'End Date', description: 'Implementation end date' },
    'lat': { label: 'Latitude', description: 'Geographic latitude' },
    'lon': { label: 'Longitude', description: 'Geographic longitude' },
    'address': { label: 'Address', description: 'Physical address' },
    'notes': { label: 'Notes', description: 'Additional information' },
    'remarks': { label: 'Remarks', description: 'Implementation remarks' },
    'artifacts': { label: 'Artifacts', description: 'Implementation artifacts' }
  };

  const handleOpen = () => setOpen(!open);
  
  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleColumnMapping = (csvColumn, dbColumn) => {
    setMappings({
      ...mappings,
      [csvColumn]: dbColumn,
    });
  };

  // Check if all required fields are mapped
  const areRequiredFieldsMapped = () => {
    const mappedFields = Object.values(mappings);
    return requiredFields.every(field => mappedFields.includes(field));
  };

  // Get mapping status for UI feedback
  const getMappingStatus = () => {
    if (!importData?.header?.length) return 'waiting';
    
    const mappedRequiredFields = requiredFields.filter(field => 
      Object.values(mappings).includes(field)
    );
    
    if (mappedRequiredFields.length === requiredFields.length) {
      return 'ready';
    } else {
      return `Missing ${requiredFields.length - mappedRequiredFields.length} required fields`;
    }
  };

  const validateMappings = () => {
    // Check if all required fields are mapped
    const mappedFields = Object.values(mappings);
    
    for (const field of requiredFields) {
      if (!mappedFields.includes(field)) {
        toast.error(`Required field '${fieldDefinitions[field].label}' must be mapped to a CSV column`);
        return false;
      }
    }
    
    return true;
  };

  const handleSaveMapping = async () => {
    if (!validateMappings()) return;

    setLoading(true);
    setImportStatus('loading');
    setImportMessage('Importing data...');
    setImportProgress(0);
    
    try {
      // Setup progress monitoring
      const importInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 5, 90));
      }, 300);
      
      const response = await axios.post(route('implementation.field.map.save'), {
        file_path: importData.filePath,
        mappings: mappings,
      });

      clearInterval(importInterval);
      setImportProgress(100);
      setImportStatus('success');
      setImportMessage('Import successful!');
      
      toast.success("CSV file imported successfully");
      
      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false);
        // Refresh the page to show new data
        router.visit(route('implementation.field.name.index'));
      }, 2000);
    } catch (error) {
      setImportStatus('error');
      setImportMessage(error.response?.data?.error?.message || "Failed to import CSV file");
      console.error("Import error:", error);
      toast.error(error.response?.data?.error?.message || "Failed to import CSV file");
    } finally {
      setLoading(false);
    }
  };

  // Get preview of data for a column
  const getColumnPreview = (columnName) => {
    if (!importData?.preview || !importData.preview.length) return 'No preview available';
    
    return importData.preview.slice(0, 3).map(row => row[columnName] || '').filter(Boolean).join(', ');
  };

  const handleFileUpload = async (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('import_file', file);
    
    setLoading(true);
    setImportStatus('loading');
    setImportMessage('Analyzing file...');
    setImportProgress(25);
    
    try {
      const response = await axios.post(route("implementation.field.name.import"), formData);
      
      setImportProgress(50);
      setImportMessage('Processing data...');
      
      setImportData({
        file,
        filePath: response.data.filePath,
        header: response.data.header,
        preview: response.data.preview || []
      });
      
      // Initialize mappings with intelligent auto-mapping
      const initialMapping = {};
      const columnLowerMap = new Map();
      
      // First pass: create a map of lowercase column names
      response.data.header.forEach(column => {
        columnLowerMap.set(column.toLowerCase(), column);
      });
      
      // Second pass: try to find exact matches or close matches
      Object.keys(fieldDefinitions).forEach(dbField => {
        // Look for exact matches
        const fieldLabel = fieldDefinitions[dbField].label.toLowerCase();
        const fieldLower = dbField.toLowerCase();
        
        // Try different variations
        const exactMatch = columnLowerMap.get(fieldLower);
        const labelMatch = columnLowerMap.get(fieldLabel);
        const includesField = Array.from(columnLowerMap.keys()).find(col => 
          col.includes(fieldLower) || col.includes(fieldLabel.replace(/\s+/g, ''))
        );
        
        if (exactMatch) {
          initialMapping[exactMatch] = dbField;
        } else if (labelMatch) {
          initialMapping[labelMatch] = dbField;
        } else if (includesField) {
          initialMapping[columnLowerMap.get(includesField)] = dbField;
        }
      });
      
      // Third pass: try to intelligently guess remaining columns
      response.data.header.forEach((column) => {
        if (initialMapping[column]) return; // Already mapped
        
        const colLower = column.toLowerCase();
        
        // Basic auto-mapping based on common column names
        if (colLower.includes('site') && colLower.includes('name')) {
          initialMapping[column] = 'site_name';
        } else if (colLower.includes('solution') && colLower.includes('type')) {
          initialMapping[column] = 'solution_type';
        } else if (colLower.includes('site') && colLower.includes('id')) {
          initialMapping[column] = 'site_id';
        } else if (colLower === 'type' || colLower.includes('implementation_type')) {
          initialMapping[column] = 'type';
        } else if (colLower.includes('status')) {
          initialMapping[column] = 'status';
        } else if (colLower.includes('start')) {
          initialMapping[column] = 'start_date';
        } else if (colLower.includes('end')) {
          initialMapping[column] = 'end_date';
        } else if (colLower === 'lat' || colLower.includes('latitude')) {
          initialMapping[column] = 'lat';
        } else if (colLower === 'lon' || colLower.includes('longitude')) {
          initialMapping[column] = 'lon';
        } else if (colLower.includes('address')) {
          initialMapping[column] = 'address';
        } else if (colLower.includes('note')) {
          initialMapping[column] = 'notes';
        } else if (colLower.includes('remark') || colLower.includes('comment')) {
          initialMapping[column] = 'remarks';
        } else if (colLower.includes('artifact') || colLower.includes('document')) {
          initialMapping[column] = 'artifacts';
        } else {
          initialMapping[column] = '';
        }
      });
      
      setMappings(initialMapping);
      setImportProgress(100);
      setImportMessage('Ready to import');
      setImportStatus('success');
      
      setOpen(true);
    } catch (error) {
      console.error("Upload error:", error);
      setImportStatus('error');
      setImportMessage(error.response?.data?.message || "Failed to process file. Please check the format.");
      toast.error("Failed to upload file");
    } finally {
      setLoading(false);
      
      // Reset the file input so the same file can be selected again
      e.target.value = '';
      
      // Call the parent's onChange if provided
      if (onChange) {
        onChange(e);
      }
    }
  };

  return (
    <>
      <Button
        color="blue"
        size="sm"
        className="flex items-center gap-2"
        onClick={handleFileSelect}
      >
        <FileUpIcon className="h-4 w-4" />
        Bulk Import
      </Button>
      
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      
      <Dialog open={open} handler={handleOpen} size="lg">
        <DialogHeader className="flex justify-between items-center">
          <Typography variant="h5">Bulk Import Data</Typography>
          <div>
            {importStatus === 'success' && <Chip color="green" value="Ready" className="ml-2" />}
            {importStatus === 'error' && <Chip color="red" value="Error" className="ml-2" />}
            {importStatus === 'loading' && <Chip color="blue" value="Processing" className="ml-2" />}
          </div>
        </DialogHeader>

        {importStatus === 'loading' && (
          <div className="px-6 py-2">
            <Typography variant="small" color="blue-gray" className="mb-2">{importMessage}</Typography>
            <Progress value={importProgress} color="blue" className="h-1" />
          </div>
        )}

        <DialogBody divider className="max-h-[70vh] overflow-y-auto">
          {loading && !importData && (
            <div className="flex flex-col justify-center items-center py-12">
              <Spinner className="h-12 w-12 text-blue-500 mb-4" />
              <Typography color="blue-gray">Analyzing your file...</Typography>
            </div>
          )}
          
          {importStatus === 'error' && (
            <Alert color="red" className="mb-4">
              <div className="flex items-center gap-3">
                <Typography variant="paragraph" className="font-medium">
                  {importMessage}
                </Typography>
              </div>
            </Alert>
          )}
          
          {importData?.header?.length && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Typography variant="h6" color="blue-gray">
                  Map Columns from {importData.file.name}
                </Typography>
                <Button 
                  variant="text" 
                  color="blue-gray" 
                  size="sm"
                  onClick={() => setShowTips(!showTips)}
                  className="flex items-center gap-2"
                >
                  <HelpCircleIcon className="h-4 w-4" />
                  {showTips ? "Hide Tips" : "Show Tips"}
                </Button>
              </div>
              
              {showTips && (
                <Alert color="blue" className="bg-blue-50 border border-blue-100">
                  <div className="space-y-2">
                    <Typography variant="small" className="font-medium">Import Tips:</Typography>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Required fields are marked with an asterisk (*)</li>
                      <li>You can map multiple CSV columns to the same database field</li>
                      <li>Use "Skip this column" to ignore columns you don't need</li>
                      <li>The system has tried to auto-map columns based on their names</li>
                      <li>Preview data is shown to help you identify column contents</li>
                    </ul>
                  </div>
                </Alert>
              )}
              
              <div className="border border-blue-gray-100 rounded-lg overflow-hidden">
                <div className="bg-blue-gray-50 px-4 py-2 border-b border-blue-gray-100">
                  <Typography variant="small" className="font-semibold">
                    Column Mapping Status: {getMappingStatus() === 'ready' ? (
                      <span className="text-green-500">Ready to import</span>
                    ) : (
                      <span className="text-orange-500">{getMappingStatus()}</span>
                    )}
                  </Typography>
                </div>
                
                <div className="divide-y divide-blue-gray-100">
                  {importData.header.map((csvColumn, index) => (
                    <div key={index} className="p-4 grid grid-cols-12 gap-4 hover:bg-blue-gray-50/50">
                      <div className="col-span-4">
                        <Typography variant="small" className="font-medium text-blue-gray-800 mb-1">
                          CSV Column:
                        </Typography>
                        <div className="flex items-center">
                          <Typography variant="paragraph" className="font-semibold text-blue-500">
                            {csvColumn}
                          </Typography>
                        </div>
                        <Typography variant="small" className="text-blue-gray-600 mt-1 truncate" title={getColumnPreview(csvColumn)}>
                          Preview: {getColumnPreview(csvColumn) || 'No data'}
                        </Typography>
                      </div>
                      
                      <div className="col-span-1 flex items-center justify-center">
                        <div className="w-6 h-0.5 bg-blue-gray-200"></div>
                      </div>
                      
                      <div className="col-span-7">
                        <Typography variant="small" className="font-medium text-blue-gray-800 mb-1">
                          Database Field:
                        </Typography>
                        <Select
                          label="Map to database field"
                          value={mappings[csvColumn] || ''}
                          onChange={(value) => handleColumnMapping(csvColumn, value)}
                          className={requiredFields.includes(mappings[csvColumn]) 
                            ? "border-green-500" 
                            : mappings[csvColumn] 
                              ? "border-blue-500" 
                              : ""
                          }
                        >
                          <Option value="">-- Skip this column --</Option>
                          {Object.entries(fieldDefinitions).map(([field, { label, description, required }]) => (
                            <Option 
                              key={field} 
                              value={field} 
                              className={`flex items-center justify-between ${required ? "text-red-500 font-medium" : ""}`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{label} {required && "*"}</span>
                                {Object.values(mappings).includes(field) && (
                                  <Chip 
                                    size="sm" 
                                    value="Mapped" 
                                    color="green" 
                                    className="ml-2 px-2 py-1 text-xs"
                                  />
                                )}
                              </div>
                            </Option>
                          ))}
                        </Select>
                        {mappings[csvColumn] && (
                          <Typography variant="small" className="text-blue-gray-600 mt-1 italic">
                            {fieldDefinitions[mappings[csvColumn]]?.description || ''}
                          </Typography>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="px-6 py-4 border-t flex flex-col sm:flex-row justify-end gap-3">
          {importStatus === 'success' && importData?.header?.length > 0 && (
            <div className="mr-auto">
              <Typography variant="small" className="text-blue-gray-600">
                {importData.header.length} columns found, {Object.values(mappings).filter(Boolean).length} mapped
              </Typography>
            </div>
          )}
          
          <Button 
            variant="outlined" 
            color="red" 
            onClick={handleOpen}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button 
            color="green" 
            onClick={handleSaveMapping}
            disabled={loading || !importData?.header?.length || !areRequiredFieldsMapped()}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4" /> 
                Importing...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Import Data
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
