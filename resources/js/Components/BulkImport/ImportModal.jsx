import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Button, FileInput, Select } from '@/Components/Form';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const ImportModal = ({ 
    isOpen, 
    onClose, 
    title,
    description,
    templateUrl,
    importUrl,
    requiredFields,
    onImportComplete 
}) => {
    const [file, setFile] = useState(null);
    const [mappings, setMappings] = useState({});
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapping
    const [autoMapped, setAutoMapped] = useState(false);
    const [updateExisting, setUpdateExisting] = useState(true);

    // Automatically attempt to map fields when headers are loaded
    useEffect(() => {
        if (headers.length > 0 && requiredFields.length > 0 && !autoMapped) {
            const suggestedMappings = {};
            
            // Attempt to match headers to database fields with some intelligence
            requiredFields.forEach(dbField => {
                // Try exact match first (case insensitive)
                const exactMatch = headers.find(
                    h => h.toLowerCase() === dbField.toLowerCase()
                );
                
                if (exactMatch) {
                    suggestedMappings[dbField] = exactMatch;
                } else {
                    // Try contains match (e.g. "Site Name" matches "site_name")
                    const containsMatch = headers.find(
                        h => h.toLowerCase().replace(/[_\s-]/g, '').includes(
                            dbField.toLowerCase().replace(/[_\s-]/g, '')
                        )
                    );
                    
                    if (containsMatch) {
                        suggestedMappings[dbField] = containsMatch;
                    }
                }
            });
            
            setMappings(suggestedMappings);
            setAutoMapped(true);
        }
    }, [headers, requiredFields]);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);
        setAutoMapped(false);

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', selectedFile);

            // Upload file to get headers - using the correct API path
            const response = await axios.post('/api/import/preview', formData);
            
            if (response.data.success) {
                setHeaders(response.data.header);
                setStep(2);
            } else {
                toast.error('Error reading file headers');
            }
        } catch (error) {
            toast.error('Error uploading file: ' + (error.response?.data?.message || error.message));
            console.error('Upload error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        // Validate required fields are mapped, but be more flexible
        const missingFields = requiredFields.filter(field => !mappings[field]);
        if (missingFields.length > 0) {
            // Show warning instead of error for missing non-critical fields
            const criticalFields = ['site_name', 'status']; // Add your critical fields here
            const missingCriticalFields = missingFields.filter(field => criticalFields.includes(field));
            
            if (missingCriticalFields.length > 0) {
                toast.error(`Please map required fields: ${missingCriticalFields.join(', ')}`);
                return;
            } else {
                // Just show a warning for non-critical fields
                toast.warning(`Some recommended fields are not mapped: ${missingFields.join(', ')}`);
                // Continue with import
            }
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('columnMappings', JSON.stringify(mappings));
            formData.append('updateExisting', updateExisting);

            // Add additional metadata to help with validation
            formData.append('importOptions', JSON.stringify({
                allowPartialMapping: true, // Allow importing with some unmapped fields
                skipInvalidRows: true, // Skip rows with invalid data instead of failing
                validateDates: true, // Validate date formats
                trimWhitespace: true, // Trim whitespace from text fields
            }));

            const response = await axios.post(importUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                },
                validateStatus: function (status) {
                    // Consider 422 as a "successful" response so we can handle validation errors
                    return status >= 200 && status < 500;
                }
            });

            if (response.status === 422) {
                // Handle validation errors more gracefully
                const errors = response.data.errors || {};
                const errorMessages = Object.values(errors).flat();
                
                if (errorMessages.length > 0) {
                    toast.error(
                        <div>
                            <p>Please fix the following issues:</p>
                            <ul className="list-disc pl-4 mt-2">
                                {errorMessages.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    );
                } else {
                    toast.error(response.data.message || 'Validation failed');
                }
                return;
            }

            if (response.data.success) {
                toast.success(response.data.message || 'Import started successfully');
                onImportComplete?.(response.data);
                onClose();
            } else {
                toast.error(response.data.message || 'Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            
            // More detailed error handling
            if (error.response) {
                // Server responded with an error
                const errorMessage = error.response.data?.message || 'Server error during import';
                const validationErrors = error.response.data?.errors;
                
                if (validationErrors) {
                    // Show validation errors in a more user-friendly way
                    const errorList = Object.values(validationErrors).flat();
                    toast.error(
                        <div>
                            <p>Validation errors:</p>
                            <ul className="list-disc pl-4 mt-2">
                                {errorList.map((err, index) => (
                                    <li key={index}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    );
                } else {
                    toast.error(errorMessage);
                }
            } else if (error.request) {
                // Request was made but no response received
                toast.error('No response from server. Please check your connection.');
            } else {
                // Something else went wrong
                toast.error('Error preparing import: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMappingChange = (dbField, csvHeader) => {
        setMappings(prev => ({
            ...prev,
            [dbField]: csvHeader
        }));
    };

    const resetModal = () => {
        setFile(null);
        setMappings({});
        setHeaders([]);
        setStep(1);
        setLoading(false);
        setAutoMapped(false);
        setUpdateExisting(true);
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-2xl w-full rounded bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
                    <Dialog.Title className="text-lg font-medium mb-4 flex-shrink-0">{title}</Dialog.Title>
                    
                    <div className="mb-6 flex-shrink-0">
                        <p className="text-sm text-gray-600">{description}</p>
                        
                        {templateUrl && (
                            <div className="mt-2">
                                <a 
                                    href={templateUrl}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                    download
                                >
                                    Download template file
                                </a>
                            </div>
                        )}
                    </div>

                    {step === 1 ? (
                        <div className="space-y-4 flex-shrink-0">
                            <FileInput
                                label="Select File"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                <h3 className="font-medium">Map Columns</h3>
                                {autoMapped && Object.keys(mappings).length > 0 && (
                                    <div className="text-sm text-green-600">
                                        Some fields were automatically mapped
                                    </div>
                                )}
                            </div>
                            
                            <div className="border p-3 rounded bg-gray-50 text-sm text-gray-600 mb-4 flex-shrink-0">
                                <p>
                                    Please match each required database field to the corresponding column in your file.
                                    Fields marked with * are required.
                                </p>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                                <div className="space-y-4">
                                    {requiredFields.map(field => (
                                        <div key={field} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                                            <label className="w-1/3 flex items-center text-sm font-medium text-gray-700">
                                                {field} *
                                                {mappings[field] && (
                                                    <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                                )}
                                            </label>
                                            <Select
                                                className="w-2/3"
                                                value={mappings[field] || ''}
                                                onChange={e => handleMappingChange(field, e.target.value)}
                                            >
                                                <option value="">Select column</option>
                                                {headers.map(header => (
                                                    <option key={header} value={header}>
                                                        {header}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t flex-shrink-0">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="updateExisting"
                                        checked={updateExisting}
                                        onChange={(e) => setUpdateExisting(e.target.checked)}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="updateExisting" className="text-sm text-gray-700">
                                        Update existing records if found (using key fields)
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                    If unchecked, duplicate records will be skipped during import
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3 flex-shrink-0 pt-4 border-t">
                        <Button
                            variant="secondary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        
                        {step === 2 && (
                            <Button
                                variant="primary"
                                onClick={handleImport}
                                loading={loading}
                            >
                                Import
                            </Button>
                        )}
                    </div>
                </Dialog.Panel>
            </div>

            <style>{`
                /* Custom scrollbar styles */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.5);
                    border-radius: 3px;
                }
            `}</style>
        </Dialog>
    );
};

export default ImportModal; 