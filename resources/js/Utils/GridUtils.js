import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import axios from 'axios';

/**
 * Process columns for the DataGrid
 * @param {Array} columns - The columns to be processed
 * @param {Object} options - Additional options for column processing
 * @returns {Array} - Processed columns
 */
export const processColumns = (columns, options = {}) => {
  const {
    hiddenColumns = [],
    renamedColumns = {},
    deletedColumns = [],
    arrangeColumns = [],
    actionColumn = null
  } = options;

  // Filter out deleted columns
  let processedColumns = columns.filter(col => 
    !deletedColumns.includes(col.field)
  );

  // Hide columns
  processedColumns = processedColumns.map(col => ({
    ...col,
    hide: hiddenColumns.includes(col.field)
  }));

  // Rename columns
  processedColumns = processedColumns.map(col => {
    if (renamedColumns && renamedColumns[col.field]) {
      return {
        ...col,
        headerName: renamedColumns[col.field]
      };
    }
    return col;
  });

  // Add action column if provided
  if (actionColumn) {
    processedColumns.push(actionColumn);
  }

  // Arrange columns if specified
  if (arrangeColumns && arrangeColumns.length > 0) {
    const columnOrder = {};
    arrangeColumns.forEach((field, index) => {
      columnOrder[field] = index;
    });

    processedColumns.sort((a, b) => {
      if (columnOrder[a.field] !== undefined && columnOrder[b.field] !== undefined) {
        return columnOrder[a.field] - columnOrder[b.field];
      }
      if (columnOrder[a.field] !== undefined) return -1;
      if (columnOrder[b.field] !== undefined) return 1;
      return 0;
    });
  }

  return processedColumns;
};

/**
 * Handle cell edit commit for DataGrid
 * @param {Object} params - The cell edit params
 * @param {Function} setRows - Function to update rows state
 * @param {Function} setChangedData - Function to update changed data
 */
export const handleCellEditCommit = (params, setRows, setChangedData) => {
  const { id, field, value } = params;
  setRows(prevRows => 
    prevRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    )
  );
  setChangedData(prevData => ({
    ...prevData,
    [id]: {
      ...prevData[id],
      [field]: value
    }
  }));
};

/**
 * Handle row deletion
 * @param {number|string} id - The row ID to delete
 * @param {string} route - The route to call for deletion
 * @param {string} redirectRoute - The route to redirect to after deletion
 * @param {string} successMessage - Message to show on success
 */
export const handleDelete = async (id, route, redirectRoute, successMessage = 'Item deleted successfully') => {
  if (!id) {
    toast.error('Invalid item ID');
    return false;
  }
  
  const loadingToast = toast.loading('Deleting...');
  
  try {
    const response = await axios.delete(route);
    
    toast.dismiss(loadingToast);
    
    if (response.data.success) {
      toast.success(successMessage);
      if (redirectRoute) {
        router.visit(redirectRoute);
      }
      return true;
    } else {
      toast.error(response.data.message || 'Error deleting item');
      return false;
    }
  } catch (error) {
    toast.dismiss(loadingToast);
    console.error('Delete error:', error);
    
    if (error.response?.status === 403) {
      toast.error('You do not have permission to delete this item');
    } else if (error.response?.status === 404) {
      toast.error('Item not found or already deleted');
    } else if (error.response?.status === 422) {
      toast.error(error.response.data.message || 'Validation error');
    } else {
      toast.error(error.response?.data?.message || 'Error deleting item');
    }
    return false;
  }
};

/**
 * Handle saving of changes
 * @param {Object} changedData - The data that has been changed
 * @param {string} route - The route to call for saving
 * @param {string} successMessage - Message to show on success
 */
export const handleSave = async (changedData, route, successMessage = 'Changes saved successfully') => {
  try {
    await axios.post(route, { items: changedData });
    toast.success(successMessage);
    return true;
  } catch (error) {
    console.error('Save error:', error);
    toast.error('Error saving changes');
    return false;
  }
};

/**
 * Handle search event for DataGrid
 * @param {string} query - The search query
 * @param {string} baseUrl - The base URL to redirect to
 * @param {Object} additionalParams - Additional query parameters
 */
export const handleSearch = (query, baseUrl, additionalParams = {}) => {
  const params = { ...additionalParams };
  
  // Validate and sanitize the search query
  if (query) {
    // Trim whitespace and limit length
    let sanitizedQuery = query.trim();
    if (sanitizedQuery.length > 100) {
      sanitizedQuery = sanitizedQuery.substring(0, 100);
    }
    
    // Only add non-empty queries to params
    if (sanitizedQuery) {
      params.search = sanitizedQuery;
    }
  } else {
    // If query is empty, remove search param
    delete params.search;
  }
  
  // Build the query string
  const queryString = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  // Navigate to the URL
  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
  router.visit(url);
};

/**
 * Handle page size change
 * @param {number} newPageSize - The new page size
 * @param {string} baseUrl - The base URL to redirect to
 * @param {Object} currentParams - Current query parameters
 */
export const handlePerPageChange = (newPageSize, baseUrl, currentParams = {}) => {
  const params = { ...currentParams, per_page: newPageSize };
  const queryString = new URLSearchParams(params).toString();
  router.visit(`${baseUrl}${queryString ? `?${queryString}` : ''}`);
};

/**
 * Create a new row with default values and a temporary ID
 * @param {Object} defaultValues - Default values for the new row
 * @returns {Object} - New row object
 */
export const createNewRow = (defaultValues = {}) => {
  // Generate a temporary negative ID to distinguish new rows
  // This will be replaced with a real ID from the server after saving
  const tempId = -Math.floor(Math.random() * 1000000) - 1;
  
  // Get current date in ISO format for timestamps
  const now = new Date();
  const isoDate = now.toISOString();
  
  // Create the row with common defaults and user provided defaults
  return {
    id: tempId,
    created_at: isoDate,
    updated_at: isoDate,
    // Default status to "New" if not provided
    status: "New",
    // Merge user-provided defaults
    ...defaultValues
  };
};

/**
 * Format date for display
 * @param {string} dateString - The date string to format
 * @param {Object} options - Format options for toLocaleDateString
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    return dateString;
  }
};

/**
 * Get color for status text
 * @param {string} status - Status text
 * @returns {string} - Color name for the status
 */
export const getStatusColor = (status) => {
  if (!status) return 'gray';
  
  status = status.toLowerCase();
  
  if (status.includes('complete') || status.includes('active') || status.includes('online')) {
    return 'green';
  } else if (status.includes('pending') || status.includes('progress') || status.includes('scheduled')) {
    return 'blue';
  } else if (status.includes('error') || status.includes('fail') || status.includes('offline')) {
    return 'red';
  } else if (status.includes('warning') || status.includes('hold')) {
    return 'amber';
  }
  
  return 'gray';
}; 