import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, Typography, Button, Input, Select, Option, Textarea, Checkbox } from '@material-tailwind/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { toast } from 'react-hot-toast';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ErrorBoundary from '@/Components/ErrorBoundary';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

export default function Edit({ auth, wntd, fieldLabels }) {
  // CSRF token reference removed to avoid issues
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data from wntd prop
  useEffect(() => {
    if (wntd) {
      // Format dates
      const data = { ...wntd };
      if (data.start_date) data.start_date = new Date(data.start_date);
      if (data.end_date) data.end_date = new Date(data.end_date);
      setFormData(data);
    }
  }, [wntd]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error if value is provided
    if (value && errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle date changes
  const handleDateChange = (date, field) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Validate required fields
    const newErrors = {};
    if (!formData.site_name) newErrors.site_name = 'Site name is required';
    if (!formData.loc_id) newErrors.loc_id = 'Location ID is required';
    if (!formData.wntd) newErrors.wntd = 'WNTD is required';
    
    // If there are validation errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitting(false);
      toast.error('Please fill in all required fields');
      return;
    }

    // Submit the form
    router.post(route('wntd.field.name.save.item'), formData, {
      onSuccess: () => {
        setSubmitting(false);
        toast.success('WNTD record updated successfully');
        router.visit(route('wntd.field.name.show', { id: wntd.id }));
      },
      onError: (errors) => {
        setSubmitting(false);
        setErrors(errors);
        toast.error('Failed to update WNTD record');
      }
    });
  };

  return (
    <Authenticated
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Edit WNTD: {wntd.loc_id} - {wntd.wntd}
          </h2>
          <div className="flex gap-2">
            <Link href={route("wntd.field.name.show", { id: wntd.id })}>
              <Button size="sm" variant="outlined" className="flex items-center gap-1">
                <ArrowBackIcon fontSize="small" /> Back to Details
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <Head title={`Edit WNTD: ${wntd.loc_id}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <ErrorBoundary>
            <Card className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* Basic Information */}
                  <div className="form-group">
                    <Typography variant="h6" color="blue-gray" className="mb-4">
                      Basic Information
                    </Typography>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.site_name} *
                      </Typography>
                      <Input
                        name="site_name"
                        value={formData.site_name || ''}
                        onChange={handleChange}
                        error={!!errors.site_name}
                      />
                      {errors.site_name && (
                        <Typography variant="small" color="red" className="mt-1">
                          {errors.site_name}
                        </Typography>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.loc_id} *
                      </Typography>
                      <Input
                        name="loc_id"
                        value={formData.loc_id || ''}
                        onChange={handleChange}
                        error={!!errors.loc_id}
                      />
                      {errors.loc_id && (
                        <Typography variant="small" color="red" className="mt-1">
                          {errors.loc_id}
                        </Typography>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.wntd} *
                      </Typography>
                      <Input
                        name="wntd"
                        value={formData.wntd || ''}
                        onChange={handleChange}
                        error={!!errors.wntd}
                      />
                      {errors.wntd && (
                        <Typography variant="small" color="red" className="mt-1">
                          {errors.wntd}
                        </Typography>
                      )}
                    </div>
                  </div>
                  
                  {/* Technical Information */}
                  <div className="form-group">
                    <Typography variant="h6" color="blue-gray" className="mb-4">
                      Technical Information
                    </Typography>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.imsi}
                      </Typography>
                      <Input
                        name="imsi"
                        value={formData.imsi || ''}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.version}
                      </Typography>
                      <Input
                        name="version"
                        value={formData.version || ''}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.bw_profile}
                      </Typography>
                      <Input
                        name="bw_profile"
                        value={formData.bw_profile || ''}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.avc}
                      </Typography>
                      <Input
                        name="avc"
                        value={formData.avc || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  {/* Tracking Information */}
                  <div className="form-group">
                    <Typography variant="h6" color="blue-gray" className="mb-4">
                      Tracking Information
                    </Typography>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.status}
                      </Typography>
                      <Select
                        name="status"
                        value={formData.status || ''}
                        onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <Option value="">Select Status</Option>
                        <Option value="Active">Active</Option>
                        <Option value="Pending">Pending</Option>
                        <Option value="Inactive">Inactive</Option>
                        <Option value="Completed">Completed</Option>
                      </Select>
                    </div>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.solution_type}
                      </Typography>
                      <Input
                        name="solution_type"
                        value={formData.solution_type || ''}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.start_date}
                      </Typography>
                      <div className="w-full border border-gray-300 rounded">
                        <DatePicker
                          selected={formData.start_date}
                          onChange={(date) => handleDateChange(date, 'start_date')}
                          className="w-full p-2 rounded"
                          dateFormat="yyyy-MM-dd"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.end_date}
                      </Typography>
                      <div className="w-full border border-gray-300 rounded">
                        <DatePicker
                          selected={formData.end_date}
                          onChange={(date) => handleDateChange(date, 'end_date')}
                          className="w-full p-2 rounded"
                          dateFormat="yyyy-MM-dd"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Location Information */}
                <div className="mb-6">
                  <Typography variant="h6" color="blue-gray" className="mb-4">
                    Location Information
                  </Typography>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.lat}
                      </Typography>
                      <Input
                        type="number"
                        step="0.000001"
                        name="lat"
                        value={formData.lat || ''}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                        {fieldLabels.lon}
                      </Typography>
                      <Input
                        type="number"
                        step="0.000001"
                        name="lon"
                        value={formData.lon || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Remarks Information */}
                <div className="mb-6">
                  <Typography variant="h6" color="blue-gray" className="mb-4">
                    Additional Information
                  </Typography>
                  
                  <div className="mb-4">
                    <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
                      {fieldLabels.remarks}
                    </Typography>
                    <Textarea
                      name="remarks"
                      value={formData.remarks || ''}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>
                </div>
                
                {/* Form Actions */}
                <div className="flex justify-end gap-4 mt-8">
                  <Link href={route("wntd.field.name.show", { id: wntd.id })}>
                    <Button color="gray" variant="outlined" className="flex items-center gap-1">
                      <CancelIcon fontSize="small" /> Cancel
                    </Button>
                  </Link>
                  
                  <Button 
                    type="submit" 
                    color="blue" 
                    className="flex items-center gap-1"
                    disabled={submitting}
                  >
                    <SaveIcon fontSize="small" /> Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </ErrorBoundary>
        </div>
      </div>
    </Authenticated>
  );
} 