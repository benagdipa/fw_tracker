import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Alert,
  Input,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Badge
} from "@material-tailwind/react";
import { router, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";
import axios from "axios";
import { FileUpIcon, InfoIcon, CheckCircleIcon, HelpCircleIcon, XIcon, AlertTriangleIcon, EyeIcon, TableIcon } from "lucide-react";

export default function CSVMapping({
  open = false,
  onClose,
  data,
  onSubmit,
  status = 'idle',
  error = null,
  progress = 0
}) {
  // CSRF token reference removed to avoid issues
  
  // State management
  const [mappings, setMappings] = useState({});
  const [activeTab, setActiveTab] = useState('mapping');
  const [validationErrors, setValidationErrors] = useState({});
  const [requiredFields] = useState(['site_name', 'wntd']);
  const [showTips, setShowTips] = useState(false);
  
  // Field definitions with descriptions for better UI
  const fieldDefinitions = useMemo(() => ({
    'site_name': { 
      label: 'Site Name', 
      description: 'Name of the site', 
      required: true,
      validator: (value) => value && String(value).trim().length > 0
    },
    'wntd': { 
      label: 'WNTD', 
      description: 'WNTD identifier', 
      required: true,
      validator: (value) => value && String(value).trim().length > 0
    },
    'loc_id': { 
      label: 'Location ID', 
      description: 'Site location identifier'
    },
    'imsi': { 
      label: 'IMSI', 
      description: 'International Mobile Subscriber Identity',
      validator: (value) => !value || /^[0-9]{10,15}$/.test(String(value))
    },
    'version': { 
      label: 'Version', 
      description: 'Version number'
    },
    'bw_profile': { 
      label: 'Bandwidth Profile', 
      description: 'Connection bandwidth profile'
    },
    'status': { 
      label: 'Status', 
      description: 'Current status of the site'
    },
    'home_cell': { 
      label: 'Home Cell', 
      description: 'Home cell identifier'
    },
    'home_pci': { 
      label: 'Home PCI', 
      description: 'Physical Cell ID'
    },
    'lat': { 
      label: 'Latitude', 
      description: 'Geographic latitude',
      validator: (value) => !value || !isNaN(parseFloat(value))
    },
    'lon': { 
      label: 'Longitude', 
      description: 'Geographic longitude',
      validator: (value) => !value || !isNaN(parseFloat(value))
    },
    'traffic_profile': { 
      label: 'Traffic Profile', 
      description: 'Traffic pattern information'
    },
    'solution_type': { 
      label: 'Solution Type', 
      description: 'Type of solution implemented'
    },
    'start_date': { 
      label: 'Start Date', 
      description: 'Project start date',
      validator: (value) => !value || !isNaN(new Date(value).getTime())
    },
    'end_date': { 
      label: 'End Date', 
      description: 'Project end date',
      validator: (value) => !value || !isNaN(new Date(value).getTime())
    },
    'remarks': { 
      label: 'Remarks', 
      description: 'Additional notes or comments'
    }
  }), []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && !data) {
      setMappings({});
      setValidationErrors({});
      setActiveTab('mapping');
    }
  }, [open, data]);

  // Process the mapping data when it changes
  useEffect(() => {
    if (data && open) {
      console.log("Processing mapping data:", data);
      
      // Initialize mappings with smart auto-detection based on header names
      const initialMappings = {};
      
      if (data.header && data.header.length > 0) {
        data.header.forEach(csvColumn => {
          // Skip empty columns
          if (!csvColumn || csvColumn.trim() === '') return;
          
          // Convert to lowercase for case-insensitive matching
          const csvLower = csvColumn.toLowerCase().trim();
          
          // Check for direct matches or close matches in field definitions
          Object.keys(fieldDefinitions).forEach(dbField => {
            const fieldDef = fieldDefinitions[dbField];
            const labelLower = fieldDef.label.toLowerCase();
            
            // Clear match logic to prevent multiple assignments
            if (
              // Exact matches
              csvLower === dbField.toLowerCase() || 
              csvLower === labelLower || 
              // Partial matches - column contains field name or vice versa
              csvLower.includes(dbField.toLowerCase()) || 
              csvLower.includes(labelLower) ||
              // Required field special handling
              (fieldDef.required && (
                // Additional checks for required fields to maximize chances of mapping
                csvLower.includes('name') && dbField === 'site_name' ||
                (csvLower.includes('wntd') || csvLower.includes('device')) && dbField === 'wntd'
              ))
            ) {
              // Only assign if this column hasn't been mapped yet
              if (!initialMappings[csvColumn]) {
                initialMappings[csvColumn] = dbField;
              }
            }
          });
        });
      }
      
      console.log("Auto-detected mappings:", initialMappings);
      setMappings(initialMappings);
      setValidationErrors({});
    }
  }, [data, open, fieldDefinitions]);

  // Handle mapping changes
  const handleMappingChange = useCallback((csvColumn, dbColumn) => {
    setMappings(prev => ({
      ...prev,
      [csvColumn]: dbColumn || '' // Use empty string if dbColumn is null/undefined
    }));
    
    // Clear validation errors for this field when it's remapped
    if (dbColumn) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[dbColumn];
        return updated;
      });
    }
  }, []);

  // Validate a sample against the field definitions
  const validateSample = useCallback(() => {
    if (!data || !data.sample || !mappings) return {}; 
    
    const errors = {};
    
    // Create a mapping from DB fields to CSV columns
    const dbToCSVMapping = {};
    Object.entries(mappings).forEach(([csvCol, dbField]) => {
      if (dbField) {
        dbToCSVMapping[dbField] = dbToCSVMapping[dbField] || [];
        dbToCSVMapping[dbField].push(csvCol);
      }
    });
    
    // Check all required fields are mapped
    requiredFields.forEach(field => {
      if (!dbToCSVMapping[field] || dbToCSVMapping[field].length === 0) {
        errors[field] = `Required field "${fieldDefinitions[field].label}" is not mapped`;
      }
    });
    
    // Check sample data for mapped fields
    data.sample.forEach((row, rowIndex) => {
      Object.entries(dbToCSVMapping).forEach(([dbField, csvColumns]) => {
        if (csvColumns.length > 0) {
          // Get the first non-empty value from mapped columns
          let value = null;
          for (const csvCol of csvColumns) {
            if (row[csvCol] !== undefined && row[csvCol] !== null && row[csvCol] !== '') {
              value = row[csvCol];
              break;
            }
          }
          
          // Validate the value if field has a validator
          if (fieldDefinitions[dbField]?.validator && value !== null) {
            const isValid = fieldDefinitions[dbField].validator(value);
            if (!isValid) {
              errors[dbField] = errors[dbField] || [];
              errors[dbField].push({
                row: rowIndex + 1,
                value,
                message: `Invalid ${fieldDefinitions[dbField].label} value: "${value}"`
              });
            }
          }
          
          // Check required fields have values
          if (fieldDefinitions[dbField]?.required && (value === null || value === undefined || value === '')) {
            errors[dbField] = errors[dbField] || [];
            errors[dbField].push({
              row: rowIndex + 1,
              value,
              message: `Missing required value for ${fieldDefinitions[dbField].label}`
            });
          }
        }
      });
    });
    
    return errors;
  }, [data, mappings, requiredFields, fieldDefinitions]);

  // Run validation when mappings change
  useEffect(() => {
    if (data && data.sample && Object.keys(mappings).length > 0) {
      const errors = validateSample();
      setValidationErrors(errors);
    }
  }, [mappings, data, validateSample]);

  // Check if all required fields are mapped
  const areRequiredFieldsMapped = useCallback(() => {
    const mappedFields = new Set(Object.values(mappings).filter(Boolean)); // Filter out empty strings
    return requiredFields.every(field => mappedFields.has(field));
  }, [mappings, requiredFields]);

  // Get values for a given column from sample data
  const getColumnValues = useCallback((columnName) => {
    if (!data || !data.sample) return [];
    
    return data.sample.map(row => row[columnName]);
  }, [data]);

  // Get mapping status for UI feedback
  const getMappingStatus = useCallback(() => {
    if (!data?.header?.length) return 'waiting';
    
    const mappedRequiredFields = requiredFields.filter(field => 
      Object.values(mappings).includes(field)
    );
    
    const hasValidationErrors = Object.keys(validationErrors).length > 0;
    
    if (mappedRequiredFields.length < requiredFields.length) {
      return `Missing ${requiredFields.length - mappedRequiredFields.length} required fields`;
    } else if (hasValidationErrors) {
      return 'Data validation errors present';
    } else {
      return 'ready';
    }
  }, [data, mappings, requiredFields, validationErrors]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (status === 'importing' || status === 'uploading') {
      toast.error("Please wait for the current operation to complete");
      return;
    }
    
    onClose();
  }, [status, onClose]);

  // Import the mapped data with validation
  const handleImport = useCallback(() => {
    // Validate required fields are mapped
    if (!areRequiredFieldsMapped()) {
      toast.error(`Please map all required fields: ${requiredFields.map(field => fieldDefinitions[field].label).join(', ')}`);
      return;
    }
    
    // Check for validation errors
    const errors = validateSample();
    const hasValidationErrors = Object.keys(errors).length > 0;
    
    if (hasValidationErrors) {
      // Count total errors
      let totalErrors = 0;
      Object.values(errors).forEach(err => {
        if (Array.isArray(err)) {
          totalErrors += err.length;
        } else {
          totalErrors += 1;
        }
      });
      
      // Show validation warning
      if (window.confirm(`Found ${totalErrors} validation issues with your data. Would you like to proceed anyway?`)) {
        // Continue with import despite errors
        onSubmit(data, mappings);
      } else {
        // Switch to the validation tab
        setActiveTab('validation');
        return;
      }
    } else {
      // No validation errors, proceed with import
      onSubmit(data, mappings);
    }
  }, [data, mappings, areRequiredFieldsMapped, requiredFields, fieldDefinitions, validateSample, onSubmit]);

  // Calculate field mapping statistics
  const mappingStats = useMemo(() => {
    if (!data || !data.header) return { total: 0, mapped: 0, required: 0, requiredMapped: 0 };
    
    const mappedFields = Object.values(mappings).filter(Boolean);
    const uniqueMappedFields = new Set(mappedFields);
    const requiredMappedFields = new Set(requiredFields.filter(field => uniqueMappedFields.has(field)));
    
    return {
      total: data.header.length,
      mapped: uniqueMappedFields.size,
      required: requiredFields.length,
      requiredMapped: requiredMappedFields.size
    };
  }, [data, mappings, requiredFields]);

  // Count validation errors by severity
  const errorCounts = useMemo(() => {
    let critical = 0;
    let warnings = 0;
    
    Object.entries(validationErrors).forEach(([field, errors]) => {
      if (typeof errors === 'string') {
        // Missing required field mapping
        if (requiredFields.includes(field)) critical++;
        else warnings++;
      } else if (Array.isArray(errors)) {
        // Data validation errors
        errors.forEach(err => {
          if (fieldDefinitions[field]?.required) critical++;
          else warnings++;
        });
      }
    });
    
    return { critical, warnings, total: critical + warnings };
  }, [validationErrors, requiredFields, fieldDefinitions]);

  return (
    <Dialog
      open={open}
      handler={handleClose}
      className="min-w-[80%] max-w-[90%] md:max-w-[80%] lg:max-w-[70%] overflow-auto"
      animate={{
        mount: { scale: 1, y: 0 },
        unmount: { scale: 0.9, y: -100 },
      }}
      size="xl"
    >
      <DialogHeader className="border-b px-6 py-4 flex justify-between items-center">
        <Typography variant="h5" className="flex items-center">
          Map CSV Columns to Database Fields
          {status === 'uploading' && (
            <Chip color="blue" value="Uploading" size="sm" className="ml-2" />
          )}
          {status === 'processing' && (
            <Chip color="purple" value="Processing" size="sm" className="ml-2" />
          )}
          {status === 'ready' && (
            <Chip color="amber" value="Ready" size="sm" className="ml-2" />
          )}
          {status === 'saving' && (
            <Chip color="indigo" value="Saving" size="sm" className="ml-2" />
          )}
          {status === 'success' && (
            <Chip color="green" value="Success" size="sm" className="ml-2" />
          )}
          {status === 'error' && (
            <Chip color="red" value="Error" size="sm" className="ml-2" />
          )}
        </Typography>
        <button
          onClick={handleClose}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
          disabled={status === 'importing' || status === 'uploading'}
        >
          <XIcon className="h-6 w-6" />
        </button>
      </DialogHeader>

      <DialogBody className="overflow-y-auto max-h-[70vh] p-6">
        {/* Progress indicator */}
        {(status === 'uploading' || status === 'processing' || status === 'saving') && (
          <div className="mb-6">
            <Progress value={progress} color="blue" className="h-2" />
            <Typography className="mt-2 text-sm text-gray-600">
              {status === 'uploading' ? 'Uploading file...' : 
               status === 'processing' ? 'Processing file...' : 'Saving import...'}
              {progress}%
            </Typography>
          </div>
        )}
        
        {/* Error display */}
        {status === 'error' && error && (
          <Alert color="red" className="mb-4">
            <div className="flex items-center gap-2">
              <XIcon className="h-5 w-5" />
              <Typography color="red" className="font-medium">
                {error}
              </Typography>
            </div>
          </Alert>
        )}
        
        {/* File info display */}
        {data && (
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h6">File Information</Typography>
                <Typography className="text-sm text-gray-600">
                  {data.filePath.split('/').pop() || 'Uploaded file'}
                </Typography>
                {data.header && (
                  <Typography className="text-xs text-gray-500 mt-1">
                    {data.header.length} columns found
                    {data.sample && ` | ${data.sample.length} sample rows`}
                  </Typography>
                )}
              </div>
              
              <div className="flex gap-2">
                {errorCounts.total > 0 && (
                  <Badge content={errorCounts.total} color="red">
                    <Button 
                      onClick={() => setActiveTab('validation')}
                      size="sm"
                      color="red"
                      variant="outlined"
                      className="flex items-center gap-1"
                    >
                      <AlertTriangleIcon size={16} />
                      View Issues
                    </Button>
                  </Badge>
                )}
                
                <Button 
                  onClick={() => setActiveTab('preview')}
                  size="sm"
                  color="blue"
                  variant="outlined"
                  className="flex items-center gap-1"
                >
                  <EyeIcon size={16} />
                  Preview Data
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} className="mb-6">
          <TabsHeader>
            <Tab value="mapping" onClick={() => setActiveTab('mapping')}>
              Column Mapping
            </Tab>
            <Tab value="preview" onClick={() => setActiveTab('preview')}>
              Data Preview
            </Tab>
            <Tab value="validation" onClick={() => setActiveTab('validation')}>
              Validation
              {errorCounts.total > 0 && (
                <Badge content={errorCounts.total} color="red" className="ml-2" />
              )}
            </Tab>
          </TabsHeader>
          
          <TabsBody>
            <TabPanel value="mapping">
              {/* Mapping instructions */}
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                <div className="flex">
                  <InfoIcon className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
                  <div>
                    <Typography variant="h6" color="blue">Mapping Instructions</Typography>
                    <Typography className="text-sm text-blue-900">
                      Map each CSV column to the corresponding database field. Fields marked with * are required.
                    </Typography>
                    <Button 
                      color="blue" 
                      size="sm" 
                      variant="text"
                      className="mt-2 flex items-center gap-1.5 p-0"
                      onClick={() => setShowTips(!showTips)}
                    >
                      <HelpCircleIcon size={16} />
                      {showTips ? 'Hide Tips' : 'Show Tips'}
                    </Button>
                  </div>
                </div>
                
                {showTips && (
                  <div className="mt-3 pl-9 text-sm text-blue-800">
                    <ul className="list-disc space-y-1">
                      <li>Required fields must be mapped to proceed</li>
                      <li>You can map multiple CSV columns to the same database field (first valid value will be used)</li>
                      <li>Columns can be left unmapped by selecting "Don't Import"</li>
                      <li>Date fields should be in YYYY-MM-DD format or standard date formats</li>
                      <li>The system has attempted to auto-map columns based on their names</li>
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Mapping status */}
              {getMappingStatus() === 'ready' && (
                <Alert color="green" className="mb-6 flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  <Typography>All required fields are mapped. Ready to import.</Typography>
                </Alert>
              )}
              
              {getMappingStatus() !== 'ready' && getMappingStatus() !== 'waiting' && (
                <Alert color="amber" className="mb-6">
                  <Typography>{getMappingStatus()}</Typography>
                </Alert>
              )}

              {/* Column mapping grid */}
              {data && data.header && data.header.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.header.map((column, index) => (
                    column && column.trim() !== '' ? (
                      <div key={index} className={`p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
                        Object.values(mappings).filter(val => val === mappings[column]).length > 1 ? 'bg-amber-50 border-amber-200' :
                        mappings[column] ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <Typography className="font-medium truncate flex-1" title={column}>
                            {column}
                          </Typography>
                          <Chip 
                            size="sm" 
                            variant="ghost" 
                            value={mappings[column] ? 'Mapped' : 'Unmapped'} 
                            color={mappings[column] ? 'green' : 'gray'} 
                          />
                        </div>
                        
                        <Select
                          label="Map to database field"
                          value={mappings[column] || ''}
                          onChange={(value) => handleMappingChange(column, value)}
                          className="w-full mt-2"
                          color="blue"
                        >
                          <Option value="">Don't Import</Option>
                          {Object.keys(fieldDefinitions).map((field) => (
                            <Option key={field} value={field} className="flex items-center justify-between">
                              <span>
                                {fieldDefinitions[field].label}
                                {fieldDefinitions[field].required && ' *'}
                              </span>
                              {/* Visual indicator if this field is already mapped */}
                              {Object.values(mappings).includes(field) && (
                                <Chip 
                                  size="sm" 
                                  variant="ghost" 
                                  value="Already Mapped" 
                                  color="blue" 
                                  className="ml-2 text-xs"
                                />
                              )}
                            </Option>
                          ))}
                        </Select>
                        
                        {mappings[column] && (
                          <div className="mt-2">
                            <Typography className="text-xs text-gray-500 italic">
                              {fieldDefinitions[mappings[column]]?.description || ''}
                            </Typography>
                            
                            {/* Show sample values */}
                            {data.sample && (
                              <div className="mt-1">
                                <Typography className="text-xs text-gray-500">
                                  Sample: {getColumnValues(column).slice(0, 2).map(val => 
                                    val === undefined || val === null ? '(empty)' : String(val)
                                  ).join(', ')}
                                  {getColumnValues(column).length > 2 ? '...' : ''}
                                </Typography>
                              </div>
                            )}
                            
                            {/* Show validation errors */}
                            {validationErrors[mappings[column]] && (
                              Array.isArray(validationErrors[mappings[column]]) ? (
                                <div className="mt-1 text-xs text-red-500">
                                  {validationErrors[mappings[column]].length > 1 ? (
                                    <span>{validationErrors[mappings[column]].length} validation errors</span>
                                  ) : (
                                    <span>{validationErrors[mappings[column]][0].message}</span>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-1 text-xs text-red-500">
                                  {validationErrors[mappings[column]]}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ) : null
                  ))}
                </div>
              )}
            </TabPanel>
            
            <TabPanel value="preview">
              {data && data.sample && data.sample.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border-b border-r border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14">#</th>
                        {data.header.map((column, idx) => (
                          <th key={idx} className="p-2 border-b border-r border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                            <div className="flex flex-col">
                              <span>{column}</span>
                              {mappings[column] && (
                                <span className="text-blue-600 normal-case font-normal mt-1">
                                  ↳ {fieldDefinitions[mappings[column]]?.label || mappings[column]}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.sample.map((row, rowIdx) => (
                        <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-2 border-b border-r border-gray-200 text-sm text-gray-500">{rowIdx + 1}</td>
                          {data.header.map((column, colIdx) => {
                            const value = row[column];
                            const dbField = mappings[column];
                            
                            // Check for validation errors
                            let hasError = false;
                            if (dbField && validationErrors[dbField] && Array.isArray(validationErrors[dbField])) {
                              hasError = validationErrors[dbField].some(err => 
                                err.row === rowIdx + 1 && err.value === value
                              );
                            }
                            
                            return (
                              <td key={colIdx} className={`p-2 border-b border-r border-gray-200 text-sm ${
                                hasError ? 'bg-red-50 text-red-700' : dbField ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {value === undefined || value === null || value === '' ? 
                                  <span className="text-gray-400 italic">(empty)</span> : 
                                  String(value)
                                }
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <TableIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <Typography>No preview data available</Typography>
                </div>
              )}
            </TabPanel>
            
            <TabPanel value="validation">
              {errorCounts.total > 0 ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Alert color="red" className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangleIcon className="h-5 w-5" />
                        <Typography color="red" className="font-medium">
                          {errorCounts.critical} Critical Issues
                        </Typography>
                      </div>
                      <Typography className="text-xs mt-1">
                        Issues with required fields that must be fixed before importing
                      </Typography>
                    </Alert>
                    
                    <Alert color="amber" className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangleIcon className="h-5 w-5" />
                        <Typography color="amber" className="font-medium">
                          {errorCounts.warnings} Warnings
                        </Typography>
                      </div>
                      <Typography className="text-xs mt-1">
                        Potential issues that may affect data quality
                      </Typography>
                    </Alert>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(validationErrors).map(([field, errors], idx) => (
                      <div key={idx} className={`p-4 rounded-lg border ${
                        fieldDefinitions[field]?.required ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <Typography className="font-medium">
                          {fieldDefinitions[field]?.label || field}
                          {fieldDefinitions[field]?.required && ' *'}
                        </Typography>
                        
                        {typeof errors === 'string' ? (
                          <Typography className="text-sm mt-1">
                            {errors}
                          </Typography>
                        ) : (
                          <ul className="mt-2 space-y-1 text-sm">
                            {errors.map((err, errIdx) => (
                              <li key={errIdx} className="flex items-start gap-2">
                                <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5 mt-0.5">Row {err.row}</span>
                                <span>{err.message}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        <div className="mt-3">
                          <Button
                            size="sm"
                            color={fieldDefinitions[field]?.required ? "red" : "amber"}
                            variant="outlined"
                            onClick={() => setActiveTab('mapping')}
                            className="text-xs py-1.5"
                          >
                            Fix Mapping
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert color="green" className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  <Typography>No validation issues found. Data looks good!</Typography>
                </Alert>
              )}
            </TabPanel>
          </TabsBody>
        </Tabs>
      </DialogBody>

      <DialogFooter className="p-4 border-t flex justify-between">
        <div>
          {data && data.header && (
            <div className="space-y-1">
              <Typography className="text-sm text-gray-600">
                {mappingStats.mapped} of {Object.keys(fieldDefinitions).length} database fields mapped 
                ({mappingStats.requiredMapped}/{mappingStats.required} required)
              </Typography>
              {errorCounts.total > 0 && (
                <Typography className="text-xs text-red-500">
                  {errorCounts.total} validation {errorCounts.total === 1 ? 'issue' : 'issues'} found
                </Typography>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outlined" 
            color="red" 
            onClick={handleClose}
            disabled={status === 'importing' || status === 'uploading' || status === 'saving'}
            className="flex items-center gap-1"
          >
            Cancel
          </Button>
          <Button
            color="green"
            onClick={handleImport}
            disabled={
              !data || 
              !areRequiredFieldsMapped() || 
              status === 'importing' || 
              status === 'uploading' || 
              status === 'saving'
            }
            className="flex items-center gap-2"
          >
            {status === 'importing' || status === 'saving' ? (
              <>
                <Spinner className="h-4 w-4" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Import Data
              </>
            )}
          </Button>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
