import React, { useState } from 'react';
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

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', selectedFile);

            // Upload file to get headers
            const response = await axios.post('/api/import/preview', formData);
            
            if (response.data.success) {
                setHeaders(response.data.header);
                setStep(2);
            } else {
                toast.error('Error reading file headers');
            }
        } catch (error) {
            toast.error('Error uploading file');
            console.error('Upload error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        // Validate required fields are mapped
        const missingFields = requiredFields.filter(field => !mappings[field]);
        if (missingFields.length > 0) {
            toast.error(`Please map required fields: ${missingFields.join(', ')}`);
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('columnMappings', JSON.stringify(mappings));

            const response = await axios.post(importUrl, formData);

            if (response.data.success) {
                toast.success('Import started successfully');
                onImportComplete?.(response.data);
                onClose();
            } else {
                toast.error(response.data.message || 'Import failed');
            }
        } catch (error) {
            toast.error('Error during import');
            console.error('Import error:', error);
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
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-2xl rounded bg-white p-6 shadow-xl">
                    <Dialog.Title className="text-lg font-medium mb-4">{title}</Dialog.Title>
                    
                    <div className="mb-6">
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
                        <div className="space-y-4">
                            <FileInput
                                label="Select File"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-medium">Map Columns</h3>
                            {requiredFields.map(field => (
                                <div key={field} className="flex items-center gap-4">
                                    <label className="w-1/3">{field} *</label>
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
                    )}

                    <div className="mt-6 flex justify-end gap-3">
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
        </Dialog>
    );
};

export default ImportModal; 