import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Button, Card, CardBody, Typography, Chip, Menu, MenuHandler, MenuList, MenuItem, Popover, PopoverHandler, PopoverContent } from "@material-tailwind/react";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setChangedDataFW, setAddNewRowFW } from "@/Store/Reducers/TableSlice";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { debounce } from 'lodash';
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { logError } from "@/Utils/ErrorHandler.jsx";
import { ErrorBoundary } from "react-error-boundary";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Components
import Pagination from "@/Components/Pagination";
import TextInput from "@/Components/TextInput";
import ExportButton from "@/Components/ExportButton";
import DataGridComponent from "@/Components/DataGrid/DataGridComponent";
import StatsCard from "@/Components/StatsCard";
import "../../css/data-grid-custom.css";
import "../../css/animations.css";
import AddNewRow from "@/Components/Implementation/NewRow/AddNewRow";
import ImportDialog from "@/Components/BulkImport/ImportDialog";
import LoadingIndicator from "@/Components/LoadingIndicator";
import ActionButton from '@/Components/ActionButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import InputWithIcon from "@/Components/InputWithIcon";
import SearchIcon from '@mui/icons-material/Search';
import DialogBodyWrapper from '@/Components/DialogBodyWrapper';
import CoreModuleHeader from "@/Components/CoreModuleHeader";
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ImportModal from '@/Components/BulkImport/ImportModal';

// MUI Icons
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ProgressBar from '@/Components/ProgressBar';

// Utilities
import { 
  handleCellEditCommit, 
  handleDelete, 
  handleSave, 
  handlePerPageChange,
  handleSearch,
  processColumns,
  createNewRow
} from "@/Utils/GridUtils";

// Error Fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <pre className="text-sm bg-red-50 p-4 rounded-lg mb-4 max-w-lg overflow-auto">
        {error?.message || "Unknown error occurred"}
      </pre>
      <Button
        color="red"
        variant="outlined"
        size="sm"
        onClick={resetErrorBoundary}
        className="mt-4"
      >
        Try again
      </Button>
    </div>
  );
};

const LinkImplementationName = (params) => {
  return (
    <Link
      href={route("implementation.field.name.show", params.row.id)}
      className="text-blue-600 hover:text-blue-800 hover:underline"
      onClick={(e) => {
        e.preventDefault();
        router.visit(route("implementation.field.name.show", params.row.id));
      }}
    >
      {params.row.siteName || params.row.site_name || "N/A"}
    </Link>
  );
};

export default function Index({
  auth,
  sites,
  get_data,
  batch,
  additional_columns,
  hidden_columns,
  hidden_columns_names,
  renamed_columns,
  deleted_columns,
  arrange_columns,
}) {
  // State
  const [pageSize, setPageSize] = useState(parseInt(get_data?.per_page) || 10);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(sites?.data || []);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchText, setSearchText] = useState(get_data?.search || "");
  const [perPage, setPerPage] = useState(get_data?.per_page ? get_data?.per_page : 10);
  const [batchId, setBatchId] = useState(null);
  const [changedItems, setChangedItems] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [totalRows, setTotalRows] = useState(sites?.total || 0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [addNewRowOpen, setAddNewRowOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState({ startDate: null, endDate: null });
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  // Redux
  const dispatch = useDispatch();
  const { addNewRowFW } = useSelector((state) => state.table);
  const { role } = auth;

  // Define the implementation types and status
  const implementationTypes = [
    "new_site",
    "upgrade",
    "optimization",
    "maintenance",
    "decommission",
    "other"
  ];
  
  const status = [
    "Planned", 
    "Done", 
    "Done_With_Errors", 
    "Outstanding", 
    "in_progress", 
    "not_started", 
    "completed", 
    "delayed", 
    "cancelled"
  ];

  // Prepare base columns for the data grid
  const columns = [
    { 
      field: 'site_name', 
      headerName: 'Site Name', 
      flex: 1,
      minWidth: 150,
      renderCell: LinkImplementationName,
      editable: true
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      minWidth: 150,
      editable: true,
      type: 'singleSelect',
      valueOptions: ["Retunes", "Parameters", "ENDC_associations", "nr-nr_associations"],
      renderCell: (params) => (
        <span className="capitalize">{params.value || "—"}</span>
      )
    },
    { 
      field: 'eNB_gNB', 
      headerName: 'eNB/gNB',
      flex: 1,
      minWidth: 150,
      editable: true,
      renderCell: (params) => (
        <span>{params.value || "—"}</span>
      )
    },
    { 
      field: 'implementor', 
      headerName: 'Implementor',
      flex: 1,
      minWidth: 150,
      editable: true,
      renderCell: (params) => (
        <span>{params.value || "—"}</span>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 150,
      editable: true,
      type: 'singleSelect',
      valueOptions: status,
      renderCell: (params) => {
        if (!params.value) return <span className="text-gray-400">—</span>;
        
        let bgColor = "bg-gray-100";
        let textColor = "text-gray-800";
        
        switch(params.value?.toLowerCase()) {
          case 'done':
          case 'completed':
            bgColor = "bg-green-100";
            textColor = "text-green-800";
            break;
          case 'in_progress':
          case 'planned':
            bgColor = "bg-blue-100";
            textColor = "text-blue-800";
            break;
          case 'done_with_errors':
          case 'outstanding':
            bgColor = "bg-red-100";
            textColor = "text-red-800";
            break;
          case 'delayed':
          case 'cancelled':
            bgColor = "bg-amber-100";
            textColor = "text-amber-800";
            break;
        }
        
        return (
          <span className={`${bgColor} ${textColor} text-xs font-medium px-2.5 py-0.5 rounded capitalize`}>
            {params.value.replace(/_/g, ' ')}
          </span>
        );
      }
    },
    {
      field: 'start_date',
      headerName: 'Start Date',
      flex: 1,
      minWidth: 150,
      editable: true,
      type: 'date',
      valueFormatter: (params) => {
        if (!params.value) return '—';
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      flex: 1,
      minWidth: 150,
      editable: true,
      type: 'date',
      valueFormatter: (params) => {
        if (!params.value) return '—';
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1.5,
      minWidth: 200,
      editable: true,
      renderCell: (params) => (
        <div className="whitespace-normal">
          {params.value || "—"}
        </div>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      width: 100,
      getActions: (params) => {
        const isEdited = changedItems.includes(params.id);
        
        return [
          <GridActionsCellItem
            icon={<EditIcon className="text-blue-600" />}
            label="Edit"
            onClick={() => handleRowEdit(params.id)}
            className="hover:bg-blue-50"
          />,
          isEdited && (
            <GridActionsCellItem
              icon={<SaveIcon className="text-green-600" />}
              label="Save"
              onClick={() => handleRowSave(params.id)}
              className="hover:bg-green-50"
            />
          ),
          <GridActionsCellItem
            icon={<DeleteIcon className="text-red-600" />}
            label="Delete"
            onClick={() => handleRowDelete(params.id)}
            className="hover:bg-red-50"
          />
        ].filter(Boolean);
      }
    }
  ];

  // Error handling
  const handleError = useCallback((error) => {
    console.error("Implementation Tracker Error:", error);
    toast.error(error?.message || "An unexpected error occurred");
  }, []);

  // Initialize data
  useEffect(() => {
    if (sites?.data) {
      try {
        const processedData = sites.data.map(site => ({
          id: site.id,
          site_name: site.site_name || site.siteName || '',
          category: site.category || '',
          eNB_gNB: site.eNB_gNB || '',
          implementor: site.implementor || '',
          status: site.status || 'not_started',
          start_date: site.start_date ? new Date(site.start_date) : null,
          end_date: site.end_date ? new Date(site.end_date) : null,
          progress: site.progress || 0,
          notes: site.notes || '',
          created_at: site.created_at,
          updated_at: site.updated_at
        }));
        
        setRows(processedData);
        setTotalRows(sites.total || processedData.length);
      } catch (err) {
        console.error('Error processing implementation data:', err);
        toast.error('Error loading implementation data');
      }
    }
  }, [sites]);

  // Edit row handler
  const handleRowEdit = (id) => {
    router.visit(route("implementation.field.name.show", id));
  };

  // Delete row handler
  const handleRowDelete = async (id) => {
    // Confirmation dialog
    if (!window.confirm("Are you sure you want to delete this Implementation record? This action cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    const loadingToast = toast.loading("Deleting record...");
    
    try {
      const response = await axios.delete(route("implementation.field.name.delete", id));
      
      toast.dismiss(loadingToast);
      
      if (response.data && response.data.success) {
        toast.success("Implementation record deleted successfully");
        
        // Remove the deleted row from the state
        setRows(rows.filter(row => row.id !== id));
      } else {
        toast.error(response.data?.message || "Failed to delete Implementation record");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Delete error:", error);
      
      if (error.response?.status === 403) {
        toast.error("You do not have permission to delete this record");
      } else if (error.response?.status === 404) {
        toast.error("Record not found or already deleted");
        // Remove from UI if it doesn't exist on server
        setRows(rows.filter(row => row.id !== id));
      } else {
        toast.error("Failed to delete Implementation record: " + (error.response?.data?.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Save row handler
  const handleRowSave = async (id) => {
    const rowData = changedItems[id];
    if (!rowData) {
      toast.error("No changes to save");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Saving changes...");
    
    try {
      const response = await axios.post(route("implementation.field.name.update"), {
        data: { id, ...rowData }
      });
      
      toast.dismiss(loadingToast);
      
      if (response.data && response.data.success) {
        toast.success("Implementation record updated successfully");
        
        // Update the rows data with the saved changes
        setRows(prevRows => prevRows.map(row => 
          row.id === id ? { ...row, ...rowData, updated_at: new Date().toISOString() } : row
        ));
        
        // Clear changed data for this row
        const updatedChangedItems = { ...changedItems };
        delete updatedChangedItems[id];
        setChangedItems(updatedChangedItems);
      } else {
        toast.error(response.data?.message || "Failed to update Implementation record");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Save error:", error);
      toast.error("Failed to update Implementation record: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Cell edit handler
  const handleCellEdit = (params) => {
    const { id, field, value } = params;
    
    // Add to changed items if not already included
    if (!changedItems.includes(id)) {
      setChangedItems(prev => [...prev, id]);
    }
    
    // Update local state
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
    
    return true;
  };

  // Page size change handler
  const handlePageSizeChange = (newPageSize) => {
    setPerPage(newPageSize);
    router.get(
      route("implementation.field.name.index"),
      { ...get_data, per_page: newPageSize },
      { preserveState: true }
    );
  };

  // Load data with debounced search
  const loadData = useCallback(
    debounce(async (searchQuery = '', currentPage = 0, rowsPerPage = 10) => {
      setLoading(true);
      router.get(
        route('implementation.field.name.index'),
        {
          search: searchQuery,
          page: currentPage + 1,
          per_page: rowsPerPage,
        },
        {
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => setLoading(false),
          onError: (err) => {
            setLoading(false);
            handleError(err);
          }
        }
      );
    }, 300),
    [handleError]
  );

  // Handle search with debounce
  const debouncedSearch = useCallback(
    debounce((query) => {
      setLoading(true);
      router.get(
        route('implementation.field.name.index'),
        { search: query, per_page: perPage },
        {
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => setLoading(false),
          onError: (err) => {
            setLoading(false);
            handleError(err);
          }
        }
      );
    }, 500),
    [perPage, handleError]
  );

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchText(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Add new row handler
  const handleAddNewRow = () => {
    const newRow = {
      id: `new-${Date.now()}`,
      siteName: "",
      category: "",
      eNB_gNB: "",
      implementor: "",
      status: "Pending",
      scheduledDate: "",
      remarks: ""
      // Add all other required fields with default values
    };
    
    // Add the new row to the UI
    setRows(prevRows => [newRow, ...prevRows]);
    
    // Save the new row to the database
    setLoading(true);
    axios.post(route("api.implementation.add.row"), { data: newRow })
      .then(response => {
        if (response.data.success) {
          toast.success("New Implementation record created successfully");
          router.reload(); // Reload to get the server-assigned ID and ensure data consistency
        } else {
          toast.error("Failed to create Implementation record: " + (response.data.message || "Unknown error"));
        }
      })
      .catch(error => {
        console.error("Error creating record:", error);
        toast.error("Failed to create Implementation record: " + (error.response?.data?.message || "Unknown error"));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Add handle import success method
  const handleImportSuccess = (data) => {
    toast.success(data.message || "Import completed successfully");
    router.reload();
  };

  // Prepare statistics
  const statistics = [
    {
      label: "Total Implementations",
      value: rows.length,
      icon: <AssignmentIcon className="h-5 w-5 text-blue-500" />
    },
    {
      label: "Completed",
      value: rows.filter(row => row.status?.toLowerCase().includes('done') || row.status?.toLowerCase().includes('complete')).length,
      icon: <BuildIcon className="h-5 w-5 text-green-500" />
    },
    {
      label: "In Progress",
      value: rows.filter(row => row.status?.toLowerCase().includes('progress')).length,
      icon: <EngineeringIcon className="h-5 w-5 text-purple-500" />
    },
    {
      label: "Scheduled",
      value: rows.filter(row => row.status?.toLowerCase().includes('plan') || row.status?.toLowerCase().includes('scheduled')).length,
      icon: <ScheduleIcon className="h-5 w-5 text-amber-500" />
    }
  ];

  // Handle file upload for import
  const handleFileUpload = (event) => {
    try {
      const file = event.target.files[0];
      
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
      
      // Show loading toast while processing
      const loadingToast = toast.loading("Processing file...");
      
      // Open import dialog with the file
      setImportDialogOpen(true);
      setImportFile(file);
      
      // Clear loading toast after a short delay
      setTimeout(() => toast.dismiss(loadingToast), 1000);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to process file. Please try again.");
    }
  };

  // Load data on initial render and when search/pagination changes
  useEffect(() => {
    loadData(searchText, page, pageSize);
  }, [searchText, page, pageSize]);

  // Add compatibility functions after the state declarations
  // Compatibility layer between old and new implementations
  useEffect(() => {
    // Make sure rows are initialized properly
    if (sites && sites.data && (!rows || rows.length === 0)) {
      setRows(sites.data);
    }
    
    // Make sure totalRows is set properly
    if (sites && sites.total && (!totalRows || totalRows === 0)) {
      setTotalRows(sites.total);
    }
  }, [sites]);
  
  // Compatibility function for row editing
  const handleRowEditCompat = (params) => {
    if (typeof handleRowEdit === 'function') {
      return handleRowEdit(params.id);
    } else if (typeof params.id === 'number' || typeof params.id === 'string') {
      router.visit(route("implementation.show", params.id));
    }
  };

  // Add this function after the existing handler functions
  const handleDateFilterChange = (dates) => {
    const [start, end] = dates;
    setDateFilter({ startDate: start, endDate: end });
  };

  // Add this function to apply filters
  const applyFilters = useCallback(() => {
    setLoading(true);
    const params = {
      search: searchText,
      per_page: perPage,
      status: statusFilter,
      start_date: dateFilter.startDate ? dateFilter.startDate.toISOString() : null,
      end_date: dateFilter.endDate ? dateFilter.endDate.toISOString() : null
    };

    router.get(
      route('implementation.field.name.index'),
      params,
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => setLoading(false),
        onError: (err) => {
          setLoading(false);
          handleError(err);
        }
      }
    );
  }, [searchText, perPage, statusFilter, dateFilter]);

  // Add handleExport function
  const handleExport = async (format) => {
    try {
      setLoading(true);
      const response = await axios.get(route('implementation.field.name.export', { format }), {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format.toLowerCase();
      link.setAttribute('download', `implementation_tracker_${new Date().toISOString().split('T')[0]}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred while exporting data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add silent CSRF token refresh function
  const refreshCsrfToken = async () => {
    try {
      const response = await axios.get('/refresh-csrf');
      if (response.data && response.data.token) {
        // Update the meta tag with the new token
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
          metaTag.setAttribute('content', response.data.token);
        }
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
      return false;
    }
    return false;
  };

  // Update refreshPage function to use Inertia router
  const refreshPage = () => {
    // Use router.visit instead of router.reload to prevent unexpected refreshes
    router.visit(route('implementation.field.name.index'), {
      preserveState: false,
      preserveScroll: false,
      only: ['items', 'get_data', 'statistics']
    });
  };

  // Update the fetchData function
  const fetchData = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await axios.get(route('implementation.field.name.index'), {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        params: {
          search: searchText,
          per_page: pageSize,
          status: statusFilter,
          start_date: dateFilter.startDate?.toISOString().split('T')[0],
          end_date: dateFilter.endDate?.toISOString().split('T')[0],
          include_deleted: false
        }
      });

      // Handle session expiration without auto-refresh
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        // Silently proceed without showing notification
        setRows([]);
        return;
      }

      if (response.data.implementations && response.data.implementations.data) {
        const processedData = response.data.implementations.data.map(item => ({
          id: item.id,
          site_name: item.site_name || '',
          category: item.category || '',
          eNB_gNB: item.eNB_gNB || '',
          implementor: item.implementor || '',
          status: item.status || 'not_started',
          start_date: item.start_date || null,
          end_date: item.end_date || null,
          progress: item.progress || 0,
          notes: item.notes || '',
          created_at: item.created_at,
          updated_at: item.updated_at
        }));

        setRows(processedData);
        setTotalRows(response.data.implementations.total || 0);
      } else if (response.data.error) {
        toast.error(response.data.error);
        setRows([]);
      } else {
        console.error('Invalid data format received:', response.data);
        toast.error('Error loading data: Invalid format');
        setRows([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401 || error.response?.status === 419) {
        // For CSRF token mismatch (419), try to refresh token and retry once
        if (error.response?.status === 419 && retryCount === 0) {
          const tokenRefreshed = await refreshCsrfToken();
          if (tokenRefreshed) {
            // Retry the fetch with the new token
            return fetchData(retryCount + 1);
          }
        }
        
        // Silently handle session expiration without notification
        setRows([]);
      } else {
        toast.error('Error loading data: ' + (error.response?.data?.message || error.message));
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Update the useEffect dependencies
  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [pageSize, searchText, statusFilter, dateFilter.startDate, dateFilter.endDate]);

  // Add handleSortChange function before the return statement
  const handleSortChange = useCallback((sortModel) => {
    if (sortModel.length === 0) return;
    
    const field = sortModel[0].field;
    const sort = sortModel[0].sort;
    
    setLoading(true);
    router.get(
      route('implementation.field.name.index'),
      {
        ...router.page,
        sort_by: field,
        sort_direction: sort,
        per_page: pageSize,
        search: searchText
      },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => setLoading(false),
        onError: (err) => {
          setLoading(false);
          handleError(err);
        }
      }
    );
  }, [pageSize, searchText]);

  // Try-catch block for rendering
  try {
    return (
      <Authenticated
        auth={auth}
        errors={{}}
      >
        <Head title="Implementation Tracker" />
        
        <div className="py-6">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onError={handleError}
              onReset={() => {
                setLoading(false);
                setRows([]);
                router.reload();
              }}
            >
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-50 flex items-center justify-center">
                  <LoadingIndicator />
                </div>
              )}

              {/* Main Content */}
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-0">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                    <StatsCard
                      title="Total Sites"
                      value={rows.length}
                      icon={<AssignmentIcon className="h-5 w-5" />}
                      color="blue"
                      tooltip="Total number of implementation sites"
                    />
                    <StatsCard
                      title="Unique eNB/gNB"
                      value={new Set(rows.map(row => row.eNB_gNB)).size}
                      icon={<BuildIcon className="h-5 w-5" />}
                      color="green"
                      tooltip="Number of unique eNB/gNB IDs"
                    />
                    <StatsCard
                      title="In Progress"
                      value={rows.filter(row => row.status?.toLowerCase() === 'in_progress').length}
                      icon={<EngineeringIcon className="h-5 w-5" />}
                      color="amber"
                      tooltip="Number of implementations in progress"
                    />
                    <StatsCard
                      title="Pending"
                      value={rows.filter(row => row.status?.toLowerCase() === 'pending' || row.status?.toLowerCase() === 'not_started').length}
                      icon={<ScheduleIcon className="h-5 w-5" />}
                      color="purple"
                      tooltip="Number of pending implementations"
                    />
                  </div>

                  {/* Search and Filters */}
                  <div className="px-6 pb-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-full sm:w-96">
                        <InputWithIcon
                          icon={<SearchIcon className="h-5 w-5 text-gray-500" />}
                          placeholder="Search implementations..."
                          value={searchText}
                          onChange={handleSearchChange}
                          className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        />
                        {searchText && (
                          <div className="mt-1 text-xs text-gray-500">
                            Search by: site name, eNB/gNB ID, implementor, status
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        {/* Import Button */}
                        <Button
                          size="sm"
                          variant="outlined"
                          color="blue"
                          className="flex items-center gap-2 bg-white"
                          onClick={() => setImportModalOpen(true)}
                        >
                          <FileUploadIcon className="h-4 w-4" />
                          Import
                        </Button>
                        <ExportButton
                          onExport={handleExport}
                          loading={loading}
                          formats={['xlsx', 'csv', 'pdf']}
                          color="blue"
                          size="sm"
                          label="Export"
                        />
                        <Menu placement="bottom-end">
                          <MenuHandler>
                            <Button 
                              variant="outlined" 
                              size="sm"
                              className="flex items-center gap-2 min-w-[120px] bg-white"
                              color={statusFilter ? "blue" : "gray"}
                            >
                              <FilterListIcon className="h-4 w-4" />
                              {statusFilter || "STATUS"}
                            </Button>
                          </MenuHandler>
                          <MenuList className="min-w-[200px] p-2">
                            <MenuItem 
                              onClick={() => {
                                setStatusFilter("");
                                applyFilters();
                              }}
                              className={`rounded ${!statusFilter ? "bg-blue-50 text-blue-900" : ""} mb-1`}
                            >
                              All Statuses
                            </MenuItem>
                            <hr className="my-2 border-blue-gray-50" />
                            {["in_progress", "completed", "pending", "not_started"].map((statusItem, index) => (
                              <MenuItem 
                                key={index} 
                                onClick={() => {
                                  setStatusFilter(statusItem);
                                  applyFilters();
                                }}
                                className={`rounded ${statusFilter === statusItem ? "bg-blue-50 text-blue-900" : ""} mb-1`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="capitalize">{statusItem.replace(/_/g, ' ')}</span>
                                </div>
                              </MenuItem>
                            ))}
                          </MenuList>
                        </Menu>
                        <Popover placement="bottom-end">
                          <PopoverHandler>
                            <Button 
                              variant="outlined" 
                              size="sm"
                              className="flex items-center gap-2 bg-white"
                              color={(dateFilter.startDate || dateFilter.endDate) ? "blue" : "gray"}
                            >
                              <CalendarMonthIcon className="h-4 w-4" />
                              DATE RANGE
                            </Button>
                          </PopoverHandler>
                          <PopoverContent className="p-0">
                            <Card className="shadow-none">
                              <div className="p-2">
                                <DatePicker
                                  selected={dateFilter.startDate}
                                  onChange={(dates) => {
                                    handleDateFilterChange(dates);
                                    if (dates[0] && dates[1]) {
                                      applyFilters();
                                    }
                                  }}
                                  startDate={dateFilter.startDate}
                                  endDate={dateFilter.endDate}
                                  selectsRange
                                  inline
                                  className="border-none shadow-none"
                                />
                              </div>
                            </Card>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Data Grid */}
                  <div className="px-6">
                    <div className="border rounded-lg overflow-hidden">
                      <DataGridComponent
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        getRowId={(row) => row.id}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onCellEditCommit={handleCellEditCommit}
                        selectedRows={selectedRows}
                        setSelectedRows={setSelectedRows}
                        perPage={pageSize}
                        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                        paginationModel={{
                          page: sites?.current_page - 1 || 0,
                          pageSize: pageSize
                        }}
                        autoHeight={false}
                        className="h-full"
                        paginationMode="server"
                        rowCount={totalRows}
                        sortingMode="server"
                        onSortModelChange={handleSortChange}
                        components={{
                          LoadingOverlay: () => (
                            <div className="flex items-center justify-center h-full">
                              <LoadingIndicator />
                            </div>
                          ),
                          NoRowsOverlay: () => (
                            <div className="flex items-center justify-center h-full">
                              <Typography color="gray">
                                {searchText ? 'No matching records found' : 'No records available'}
                              </Typography>
                            </div>
                          ),
                        }}
                        initialState={{
                          sorting: {
                            sortModel: [{ field: 'updated_at', sort: 'desc' }],
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          </div>
        </div>

        {/* Add Import Modal */}
        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          title="Import Implementation Data"
          description="Import implementation data from CSV file. Download the template for the correct format."
          templateUrl="/templates/implementation_template.csv"
          importUrl={route('implementation.import.file')}
          requiredFields={[
            'site_name',
            'cell_name',
            'category',
            'implementor',
            'status',
            'notes',
            'enm_scripts_path',
            'sp_scripts_path',
            'CRQ',
            'start_date',
            'end_date',
            'address',
            'lat',
            'lng'
          ]}
          onImportComplete={() => {
            refreshPage();
          }}
        />
      </Authenticated>
    );
  } catch (error) {
    handleError(error);
    return null;
  }
}
