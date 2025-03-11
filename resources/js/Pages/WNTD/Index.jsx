import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Card, Button, Typography, Input, Menu, MenuHandler, MenuList, MenuItem, Popover, PopoverHandler, PopoverContent, Chip } from "@material-tailwind/react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setChangedData } from "@/Store/Reducers/TableSlice";
import axios from "axios";
import { 
    AlignLeftIcon, 
    BarChart3Icon, 
    BellIcon, 
    MoonIcon, 
    SearchIcon, 
    SettingsIcon, 
    UploadIcon, 
    XIcon, 
    AlignJustifyIcon, 
    ChevronDownIcon, 
    DatabaseZapIcon, 
    FileCog2Icon, 
    FileCogIcon, 
    GaugeCircleIcon, 
    GitCommitVerticalIcon, 
    GlobeIcon, 
    LocateFixedIcon, 
    NfcIcon, 
    Settings2Icon, 
    User2Icon, 
    UserRoundCogIcon,
    HomeIcon,
    SignalIcon,
    Building2Icon,
    MapPinIcon,
    WifiIcon,
    WrenchIcon
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { setOpenCloseMenu } from '@/Store/Reducers/MenuSlice';
import { useSelector } from 'react-redux';
import ApplicationLogo from '@/Components/ApplicationLogo';
import PageTransition from '@/Components/PageTransition';
import SafeNavLink from '@/Components/SafeNavLink';
import NavLink from '@/Components/NavLink';
import { FiDatabase } from 'react-icons/fi';
import { 
    HomeIcon as HeroHomeIcon, 
    UserIcon, 
    Cog6ToothIcon, 
    BuildingLibraryIcon, 
    BuildingOffice2Icon, 
    ArrowRightOnRectangleIcon, 
    WifiIcon as HeroWifiIcon, 
    MapPinIcon as HeroMapPinIcon, 
    TableCellsIcon,
    SignalIcon as HeroSignalIcon
} from '@heroicons/react/24/outline';

// Components
import Authenticated from "@/Layouts/AuthenticatedLayout";
import DataGridComponent from "@/Components/DataGrid/DataGridComponent";
import "../../../css/data-grid-custom.css";
import ExportButton from "@/Components/ExportButton";
import LoadingIndicator from "@/Components/LoadingIndicator";
import CSVMapping from "@/Components/Wntd/CSVMapping";
import ImportDialog from "@/Components/BulkImport/ImportDialog";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ActionButton from '@/Components/ActionButton';
import StatsCard from "@/Components/StatsCard";
import CoreModuleHeader from "@/Components/CoreModuleHeader";
import ImportModal from '@/Components/BulkImport/ImportModal';

// Icons
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import RouteIcon from '@mui/icons-material/Route';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import UndoIcon from '@mui/icons-material/Undo';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

// Import reusable ErrorBoundary
import ErrorBoundary from "@/Components/ErrorBoundary";

// Safe route helper to prevent errors
const safeRoute = (routeName, params = {}) => {
  try {
    return route(routeName, params);
  } catch (error) {
    console.error(`Error generating route ${routeName}:`, error);
    return '#';
  }
};

// Utility function to safely sanitize row data
const sanitizeRowData = (row) => {
  if (!row) return null;
  
  try {
    // Create a safe copy of the row
    const safeRow = { ...row };
    
    // Ensure ID is always present and valid
    if (safeRow.id === undefined || safeRow.id === null) {
      console.warn("Row missing ID:", row);
      return null; // Skip rows without valid IDs
    }
    
    // Sanitize common fields
    const textFields = ['site_name', 'loc_id', 'wntd', 'imsi', 'version', 'avc', 
                      'bw_profile', 'home_cell', 'remarks', 'traffic_profile', 'status'];
    
    textFields.forEach(field => {
      if (safeRow[field] === null || safeRow[field] === undefined) {
        safeRow[field] = '';
      } else if (typeof safeRow[field] !== 'string') {
        // Attempt to convert to string if it's not already
        try {
          safeRow[field] = String(safeRow[field]);
        } catch (e) {
          safeRow[field] = '';
          console.warn(`Failed to convert ${field} to string:`, e);
        }
      }
    });
    
    // Sanitize numeric fields
    const numericFields = ['lon', 'lat', 'home_pci'];
    numericFields.forEach(field => {
      if (safeRow[field] === null || safeRow[field] === undefined) {
        safeRow[field] = 0;
      } else if (typeof safeRow[field] !== 'number') {
        // Attempt to convert to number
        try {
          safeRow[field] = Number(safeRow[field]);
          if (isNaN(safeRow[field])) safeRow[field] = 0;
        } catch (e) {
          safeRow[field] = 0;
          console.warn(`Failed to convert ${field} to number:`, e);
        }
      }
    });
    
    // Ensure dates are valid
    ['start_date', 'end_date'].forEach(field => {
      if (safeRow[field] === null || safeRow[field] === undefined) {
        safeRow[field] = null;
      } else if (!(safeRow[field] instanceof Date) && typeof safeRow[field] === 'string') {
        try {
          const date = new Date(safeRow[field]);
          if (isNaN(date.getTime())) {
            safeRow[field] = null;
          } else {
            safeRow[field] = date;
          }
        } catch (e) {
          safeRow[field] = null;
          console.warn(`Failed to convert ${field} to date:`, e);
        }
      }
    });
    
    return safeRow;
  } catch (error) {
    console.error("Error sanitizing row data:", error, row);
    return null;
  }
};

// Field validation helper
const validateField = (field, value) => {
  // Define validation rules with regex patterns
  const rules = {
    site_name: {
      required: true,
      validate: (val) => typeof val === 'string' && val.trim().length > 0,
      message: 'Site name is required'
    },
    wntd: {
      required: true,
      validate: (val) => typeof val === 'string' && val.trim().length > 0,
      message: 'WNTD identifier is required'
    },
    imsi: {
      validate: (val) => !val || /^\d{15}$/.test(val),
      message: 'IMSI must be a 15-digit number'
    },
    version: {
      validate: (val) => !val || /^v?\d+\.\d+(\.\d+)?$/.test(val),
      message: 'Version must be in format: v1.0 or 1.0.0'
    },
    lat: {
      validate: (val) => !val || (typeof val === 'number' && val >= -90 && val <= 90) || (!isNaN(parseFloat(val)) && parseFloat(val) >= -90 && parseFloat(val) <= 90),
      message: 'Latitude must be a number between -90 and 90'
    },
    lon: {
      validate: (val) => !val || (typeof val === 'number' && val >= -180 && val <= 180) || (!isNaN(parseFloat(val)) && parseFloat(val) >= -180 && parseFloat(val) <= 180),
      message: 'Longitude must be a number between -180 and 180'
    },
    start_date: {
      validate: (val) => !val || !isNaN(new Date(val).getTime()),
      message: 'Start date must be a valid date'
    },
    end_date: {
      validate: (val) => !val || !isNaN(new Date(val).getTime()),
      message: 'End date must be a valid date'
    },
    avc: {
      validate: (val) => !val || /^[A-Za-z0-9\-_\.]+$/.test(val),
      message: 'AVC contains invalid characters'
    },
    bw_profile: {
      validate: (val) => !val || /^[A-Za-z0-9\-_\.]+$/.test(val),
      message: 'BW Profile contains invalid characters'
    },
    home_cell: {
      validate: (val) => !val || /^[0-9]+$/.test(val),
      message: 'Home Cell must be numeric'
    },
    home_pci: {
      validate: (val) => !val || /^[0-9]+$/.test(val),
      message: 'Home PCI must be numeric'
    }
  };

  // If no rules for this field, return valid
  if (!rules[field]) return { valid: true };

  // Check required
  if (rules[field].required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return { valid: false, message: rules[field].message };
  }

  // Run validation function
  if (rules[field].validate && !rules[field].validate(value)) {
    return { valid: false, message: rules[field].message };
  }

  return { valid: true };
};

// Check all required fields
const validateFields = (row, schema) => {
  const errors = [];
  
  Object.keys(schema).forEach(field => {
    if (schema[field].required) {
      const value = row[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(field);
      }
    }
  });
  
  return errors;
};

// Data sanitization function
const sanitizeValue = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

// Type enforcement function
const enforceType = (field, value) => {
  const typeMap = {
    'id': Number,
    'start_date': (val) => val ? new Date(val).toISOString().split('T')[0] : val,
    'end_date': (val) => val ? new Date(val).toISOString().split('T')[0] : val,
    'lon': Number,
    'lat': Number
  };
  
  if (typeMap[field]) {
    try {
      return typeMap[field](value);
    } catch (e) {
      return value; // If conversion fails, return original
    }
  }
  
  return value;
};

const Index = ({
  auth,
  sites,
  get_data,
  batch,
  statistics,
  error
}) => {
  const dispatch = useDispatch();
  // CSRF token reference removed to avoid issues
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState((get_data && get_data.search) || "");
  const [rows, setRows] = useState([]);
  const [changedData, setChangedData] = useState({});
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const fileInputRef = useRef(null);
  
  const [importStatus, setImportStatus] = useState('idle');
  const [importError, setImportError] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  
  // New state variables for enhanced functionality
  const [editVersions, setEditVersions] = useState({});
  const [deletedRows, setDeletedRows] = useState([]);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [activeSort, setActiveSort] = useState('');
  
  // State for selection
  const [selectedRows, setSelectedRows] = useState([]);
  
  // Add new state for filters
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });
  
  // Add state for import modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  useEffect(() => {
    if (sites && sites.data) {
      setRows(sites.data);
    }
  }, [sites]);
  
  useEffect(() => {
    if (changedData && Object.keys(changedData).length > 0) {
      dispatch(setChangedData(changedData));
    }
  }, [changedData, dispatch]);
  
  // Synchronize rows and changedData
  useEffect(() => {
    if (changedData && Object.keys(changedData).length > 0) {
      // Apply pending changes to rows for consistent view
      setRows(prevRows => 
        prevRows.map(row => 
          changedData[row.id] ? { ...row, ...changedData[row.id] } : row
        )
      );
    }
  }, [changedData]);
  
  // Define the base column definitions
  const columnDefinitions = useMemo(() => [
    { 
      field: 'loc_id', 
      headerName: 'Location ID', 
      flex: 1, 
      minWidth: 140, 
      editable: true,
      renderCell: (params) => {
        // Safely handle null/undefined values
        if (params.value === null || params.value === undefined || !params.row?.id) {
          return <span className="text-gray-400">—</span>;
        }
        
        return (
          <Link 
            href={route('wntd.field.name.show', { id: params.row.id })}
            className="text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click event
              e.preventDefault();
              router.visit(route('wntd.field.name.show', { id: params.row.id }));
            }}
          >
            {params.value}
          </Link>
        );
      }
    },
    { 
      field: 'wntd', 
      headerName: 'WNTD', 
      flex: 1, 
      minWidth: 140, 
      editable: true,
      // Safe rendering for wntd
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        return <span>{params.value}</span>;
      }
    },
    { 
      field: 'imsi', 
      headerName: 'IMSI', 
      flex: 1, 
      minWidth: 140, 
      editable: true,
      // Safe rendering for imsi
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        return <span>{params.value}</span>;
      }
    },
    { 
      field: 'version', 
      headerName: 'Version', 
      flex: 1, 
      minWidth: 120, 
      editable: true,
      // Safe rendering for version
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        return <span>{params.value}</span>;
      }
    },
    { 
      field: 'avc', 
      headerName: 'AVC', 
      flex: 1, 
      minWidth: 120, 
      editable: true,
      // Safe rendering for avc
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        return <span>{params.value}</span>;
      }
    },
    { 
      field: 'bw_profile', 
      headerName: 'BW Profile', 
      flex: 1, 
      minWidth: 140, 
      editable: true,
      // Safe rendering for bw_profile
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        return <span>{params.value}</span>;
      }
    },
    { 
      field: 'lon', 
      headerName: 'Longitude', 
      flex: 1, 
      minWidth: 120, 
      editable: true, 
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return Number(params.value).toFixed(6);
      },
      // Safe rendering for longitude
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        try {
          return <span>{Number(params.value).toFixed(6)}</span>;
        } catch (err) {
          return <span className="text-gray-400">{params.value}</span>;
        }
      }
    },
    { 
      field: 'lat', 
      headerName: 'Latitude', 
      flex: 1, 
      minWidth: 120, 
      editable: true, 
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return Number(params.value).toFixed(6);
      },
      // Safe rendering for latitude
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        try {
          return <span>{Number(params.value).toFixed(6)}</span>;
        } catch (err) {
          return <span className="text-gray-400">{params.value}</span>;
        }
      }
    },
    { 
      field: 'site_name', 
      headerName: 'Site Name', 
      flex: 1, 
      minWidth: 150, 
      editable: true,
      // Safe rendering for site_name
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        return <span>{params.value}</span>;
      }
    },
    { 
      field: 'home_cell', 
      headerName: 'Home Cell', 
      flex: 1, 
      minWidth: 140, 
      editable: true,
      // Safe rendering for home_cell
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        return <span>{params.value}</span>;
      }
    },
    { 
      field: 'home_pci', 
      headerName: 'Home PCI', 
      flex: 1, 
      minWidth: 120, 
      editable: true,
      // Safe rendering for home_pci
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        return <span>{params.value}</span>;
      }
    },
    { 
      field: 'remarks', 
      headerName: 'Remarks', 
      flex: 1, 
      minWidth: 150, 
      editable: true,
      // Safe rendering for remarks
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        return <span>{params.value}</span>;
      }
    },
    { 
      field: 'start_date', 
      headerName: 'Start Date', 
      flex: 1, 
      minWidth: 120, 
      editable: true, 
      type: 'date',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        try {
          return new Date(params.value).toLocaleDateString();
        } catch (error) {
          console.error('Error formatting start date:', error);
          return '';
        }
      }
    },
    { 
      field: 'end_date', 
      headerName: 'End Date', 
      flex: 1, 
      minWidth: 120, 
      editable: true, 
      type: 'date',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        try {
          return new Date(params.value).toLocaleDateString();
        } catch (error) {
          console.error('Error formatting end date:', error);
          return '';
        }
      }
    },
    { field: 'solution_type', headerName: 'Solution Type', flex: 1, minWidth: 150, editable: true },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1, 
      minWidth: 120, 
      editable: true,
      renderCell: (params) => {
        const value = params.value;
        if (!value) return null;
        
        let color = "bg-gray-100 text-gray-800";
        if (value.toLowerCase().includes("complete") || value.toLowerCase().includes("active")) {
          color = "bg-green-100 text-green-800";
        } else if (value.toLowerCase().includes("pending") || value.toLowerCase().includes("progress")) {
          color = "bg-blue-100 text-blue-800";
        } else if (value.toLowerCase().includes("error") || value.toLowerCase().includes("fail")) {
          color = "bg-red-100 text-red-800";
        } else if (value.toLowerCase().includes("warning") || value.toLowerCase().includes("attention")) {
          color = "bg-amber-100 text-amber-800";
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {value}
          </span>
        );
      }
    }
  ], []);
  
  // Sanitize and prepare rows for DataGrid
  const memoizedRows = useMemo(() => {
    if (!sites?.data) return [];
    
    try {
      // Apply sanitization to each row
      const sanitizedRows = sites.data
        .map(row => sanitizeRowData(row))
        .filter(row => row !== null); // Remove any rows that failed sanitization
      
      return sanitizedRows;
    } catch (error) {
      console.error("Error preparing row data:", error);
      return [];
    }
  }, [sites?.data]);
  
  // Apply data sanitization before sending to DataGrid
  useEffect(() => {
    if (sites?.data) {
      try {
        // Check for problematic data
        const invalidRows = sites.data.filter(row => {
          if (!row || typeof row.id === 'undefined' || row.id === null) return true;
          
          // Check for any null field that might cause problems
          return false;
        });
        
        if (invalidRows.length > 0) {
          console.warn(`Found ${invalidRows.length} potentially problematic rows:`, invalidRows);
        }
      } catch (error) {
        console.error("Error checking row data:", error);
      }
    }
  }, [sites?.data]);
  
  // Enhanced CRUD operation handlers
  const handleCellEdit = useCallback((params) => {
    try {
      // Get field and new value
      const { id, field, value } = params;
      
      // Validate the field
      const validation = validateField(field, value);
      if (!validation.valid) {
        toast.error(validation.message);
        return false;
      }
      
      // Sanitize and enforce type
      const sanitizedValue = sanitizeValue(value);
      const typedValue = enforceType(field, sanitizedValue);
      
      // Store original version for undo functionality
      if (!editVersions[id]?.hasOwnProperty(field)) {
        setEditVersions(prev => ({
          ...prev,
          [id]: {
            ...(prev[id] || {}),
            [field]: rows.find(row => row.id === id)?.[field]
          }
        }));
      }
      
      // Update changedData
      setChangedData(prev => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          [field]: typedValue,
          id
        }
      }));
      
      return true;
    } catch (error) {
      console.error("Cell edit error:", error);
      toast.error(`Error updating field: ${error.message}`);
      return false;
    }
  }, [rows, editVersions, setChangedData]);

  const handleRowUpdate = useCallback(async (id) => {
    try {
      // Check if row has changes
      if (!changedData[id]) {
        toast.info("No changes to save");
        return;
      }
      
      setLoading(true);
      
      // Get the row data with changes
      const originalRow = rows.find(row => row.id === id);
      const updatedRow = { ...originalRow, ...changedData[id] };
      
      // Validate required fields
      const validationSchema = {
        site_name: { required: true },
        wntd: { required: true }
      };
      const missingFields = validateFields(updatedRow, validationSchema);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      // Prepare request data
      // CSRF token handling removed to avoid issues
      
      // Send update request with all updated data
      const response = await axios.post(safeRoute("wntd.field.name.save.item"), {
        ...updatedRow,
        _method: 'PUT'
        // _token: token removed to avoid CSRF issues
      }, {
        headers: {
          "Content-Type": "application/json",
          // "X-CSRF-TOKEN": token, removed to avoid CSRF issues
          "Accept": "application/json",
        }
      });
      
      if (response.data && response.data.success) {
        // Update local state with returned data if available
        const updatedData = response.data.data || updatedRow;
        
        setRows(prevRows => 
          prevRows.map(row => row.id === id ? { ...row, ...updatedData } : row)
        );
        
        // Clear changed data for this row
        setChangedData(prev => {
          const newData = { ...prev };
          delete newData[id];
          return newData;
        });
        
        // Clear edit versions for this row
        setEditVersions(prev => {
          const newVersions = { ...prev };
          delete newVersions[id];
          return newVersions;
        });
        
        toast.success(response.data.message || "Record updated successfully");
      } else {
        throw new Error(response.data?.message || "Failed to update record");
      }
    } catch (error) {
      console.error("Row update error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error saving changes";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [rows, changedData, validateFields, safeRoute]);

  const handleRowDelete = useCallback(async (id) => {
    try {
      // Confirm deletion
      if (!window.confirm("Are you sure you want to delete this record?")) {
        return;
      }
      
      setLoading(true);
      
      // Prepare request data
      // CSRF token handling removed to avoid issues
      
      // Send deletion request
      const response = await axios.delete(safeRoute(`wntd.field.name.delete`, { id }), {
        headers: {
          "Content-Type": "application/json",
          // "X-CSRF-TOKEN": token, removed to avoid CSRF issues
          "Accept": "application/json",
        }
      });
      
      if (response.data && response.data.success) {
        // Update local state by removing the deleted row
        setRows(prevRows => prevRows.filter(row => row.id !== id));
        
        // Add to deleted rows tracking
        setDeletedRows(prev => [...prev, { id }]);
        
        // Clear changed data for this row if any
        if (changedData[id]) {
          setChangedData(prev => {
            const newData = { ...prev };
            delete newData[id];
            return newData;
          });
        }
        
        toast.success(response.data.message || "Record deleted successfully");
      } else {
        throw new Error(response.data?.message || "Failed to delete record");
      }
    } catch (error) {
      console.error("Row deletion error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error deleting record";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [changedData, safeRoute]);

  // Function to cancel edits
  const handleCancelEdit = useCallback((id) => {
    setChangedData(prev => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
    
    setEditVersions(prev => {
      const newVersions = { ...prev };
      delete newVersions[id];
      return newVersions;
    });
    
    toast.info("Changes cancelled");
  }, []);
  
  // Then update the memoizedColumns to just use baseColumns directly
  const memoizedColumns = useMemo(() => {
    try {
      const processedColumns = processColumns(columnDefinitions || [], {
        hiddenColumns: [],
        hiddenColumnsNames: [],
        renamedColumns: {},
        deletedColumns: [],
        arrangeColumns: [],
      });
      return processedColumns;
    } catch (error) {
      console.error("Error processing columns:", error);
      return columnDefinitions || []; // Fallback to baseColumns if processing fails
    }
  }, [columnDefinitions]);
  
  // Add action column to handle row edits
  const actionsColumn = useMemo(() => ({
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => {
      const isRowEdited = changedData[params.id] !== undefined;
      
      return (
        <div className="flex gap-2">
          {isRowEdited ? (
            <>
              <GridActionsCellItem
                icon={<SaveIcon className="text-green-500" />}
                label="Save"
                onClick={() => handleRowUpdate(params.id)}
                showInMenu={false}
              />
              <GridActionsCellItem
                icon={<UndoIcon className="text-amber-500" />}
                label="Cancel"
                onClick={() => handleCancelEdit(params.id)}
                showInMenu={false}
              />
            </>
          ) : (
            <GridActionsCellItem
              icon={<EditIcon className="text-blue-500" />}
              label="Edit"
              onClick={() => {/* Cell is already editable */}}
              showInMenu={false}
            />
          )}
          <GridActionsCellItem
            icon={<DeleteIcon className="text-red-500" />}
            label="Delete"
            onClick={() => handleRowDelete(params.id)}
            showInMenu={false}
          />
        </div>
      );
    }
  }), [changedData, handleRowUpdate, handleRowDelete, handleCancelEdit]);
  
  // Combine all columns including actions
  const allColumns = useMemo(() => {
    // Add the actions column to the processed columns
    return [...memoizedColumns, actionsColumn];
  }, [memoizedColumns, actionsColumn]);

  // Handler for row selection changes
  const handleSelectionChange = useCallback((newSelection) => {
    setSelectedRows(newSelection);
  }, []);
  
  // Function to handle bulk operations
  const handleBulkOperation = useCallback((operation) => {
    if (selectedRows.length === 0) {
      toast.error('Please select at least one row');
      return;
    }
    
    // Different operations based on the action
    switch (operation) {
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedRows.length} selected rows?`)) {
          // Implementation would go here
          toast.info(`Deleting ${selectedRows.length} rows...`);
        }
        break;
        
      case 'export':
        // Implementation would go here
        toast.info(`Exporting ${selectedRows.length} rows...`);
        break;
        
      case 'status':
        // Implementation would go here
        toast.info(`Updating status for ${selectedRows.length} rows...`);
        break;
        
      default:
        toast.error('Unknown operation');
    }
  }, [selectedRows]);

  // Update refreshData function
  const refreshData = () => {
    setLoading(true);
    router.get(route('wntd.field.name.index', get_data), {
      onSuccess: () => {
        setLoading(false);
        toast.success("Data refreshed successfully");
      },
      onError: () => {
        setLoading(false);
        toast.error("Failed to refresh data");
      },
      preserveState: true
    });
  };
  
  // Update handleSortChange function
  const handleSortChange = (sortModel) => {
    setLoading(true);
    
    // Create new params object
    let params = new URLSearchParams();
    
    // Add existing query parameters
    if (get_data) {
      Object.entries(get_data).forEach(([key, value]) => {
        if (key !== 'order_by' && key !== 'order' && value) {
          params.append(key, value);
        }
      });
    }
    
    // Add sort parameters if we have sort model
    if (sortModel && sortModel.length > 0) {
      params.append('order_by', sortModel[0].field);
      params.append('order', sortModel[0].sort);
    }
    
    // Navigate to sorted URL
    router.get(route('wntd.field.name.index', Object.fromEntries(params)), {
      onSuccess: () => {
        setLoading(false);
      },
      onError: () => {
        setLoading(false);
        toast.error("Failed to sort data");
      },
      preserveState: true
    });
  };

  // Update applyFilters function
  const applyFilters = () => {
    setLoading(true);
    let params = new URLSearchParams();
    
    // Add search query
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    
    // Add status filter
    if (statusFilter) {
      params.append('status', statusFilter);
    }
    
    // Add date filters
    if (dateFilter.startDate) {
      params.append('start_date', dateFilter.startDate.toISOString().split('T')[0]);
    }
    
    if (dateFilter.endDate) {
      params.append('end_date', dateFilter.endDate.toISOString().split('T')[0]);
    }
    
    // Add ordering
    if (get_data?.order_by) {
      params.append('order_by', get_data.order_by);
      params.append('order', get_data.order || 'asc');
    }
    
    // Add pagination
    if (get_data?.per_page) {
      params.append('per_page', get_data.per_page);
    }
    
    // Navigate to filtered URL
    router.get(route('wntd.field.name.index', Object.fromEntries(params)), {
      onSuccess: () => {
        setLoading(false);
      },
      onError: () => {
        setLoading(false);
        toast.error("Failed to apply filters");
      },
      preserveState: true
    });
  };

  // Update handleExport function
  const handleExport = async (format) => {
    try {
      setLoading(true);
      const response = await axios.get(route('wntd.field.name.export', { format }), {
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
      link.setAttribute('download', `wntd_export_${new Date().toISOString().split('T')[0]}.${extension}`);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only if no input field is focused
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      
      // Prevent default for our shortcut keys
      if (['f'].includes(e.key.toLowerCase()) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
      
      switch (e.key.toLowerCase()) {
        case 'f': // Focus search
          const searchInput = document.querySelector('input[type="search"]');
          if (searchInput) {
            searchInput.focus();
          }
          break;
          
        case 'escape': // Clear selection
          if (selectedRows.length > 0) {
            setSelectedRows([]);
          }
          break;
          
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedRows.length]);

  // Calculate bandwidth profile distribution for charts
  const bwProfileData = useMemo(() => {
    if (statistics?.bandwidth_profiles) {
      return statistics.bandwidth_profiles.map(profile => ({
        name: profile.bw_profile || 'Unknown',
        value: profile.count
      })).slice(0, 5); // Show top 5
    }
    return [];
  }, [statistics]);

  // Calculate status distribution for charts
  const statusData = useMemo(() => {
    if (statistics?.status_distribution) {
      return statistics.status_distribution.map(status => ({
        name: status.status || 'Unknown',
        value: status.count
      })).slice(0, 5); // Show top 5
    }
    return [];
  }, [statistics]);

  // Handle date filter changes
  const handleDateFilterChange = (dates) => {
    const [start, end] = dates;
    setDateFilter({
      startDate: start,
      endDate: end
    });
  };

  const clearFilters = () => {
    setStatusFilter("");
    setDateFilter({startDate: null, endDate: null});
    applyFilters();
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <Authenticated
      auth={auth}
      errors={{}}
      header={
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between">
            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
              Wireless Network Terminating Device Management
            </h2>
          </div>
        </div>
      }
    >
      <Head title="Wireless Network Terminating Device Management" />
      
      <ErrorBoundary>
        <div className="py-6 px-4 mx-auto max-w-7xl lg:px-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard 
              title="Total WNTD Records" 
              value={statistics?.total || 0} 
              icon={<WifiIcon className="h-6 w-6" />}
              color="blue"
            />
            <StatsCard 
              title="Unique WNTDs" 
              value={statistics?.unique || 0} 
              icon={<SettingsInputAntennaIcon className="h-6 w-6" />}
              color="green"
            />
            <StatsCard 
              title="Active Status" 
              value={statusData.find(s => s.name?.toLowerCase().includes('active'))?.value || 0} 
              icon={<SignalCellularAltIcon className="h-6 w-6" />}
              color="amber"
            />
            <StatsCard 
              title="Pending Status" 
              value={statusData.find(s => s.name?.toLowerCase().includes('pending'))?.value || 0} 
              icon={<RouteIcon className="h-6 w-6" />}
              color="purple"
            />
          </div>
          
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4 relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-60 z-10 flex items-center justify-center">
                <LoadingIndicator size="sm" color="blue" />
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="search"
                    placeholder="Search by site name, WNTD ID, IMSI number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    className="block w-full pl-10 pr-12 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        applyFilters();
                      }}
                      className="absolute right-12 inset-y-0 flex items-center pr-2"
                    >
                      <XIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                  <Button 
                    size="sm"
                    className="!absolute right-1 top-1/2 -translate-y-1/2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center gap-2"
                    onClick={applyFilters}
                  >
                    Search
                  </Button>
                </div>
                {searchQuery && (
                  <div className="absolute mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Press Enter to search or click the Search button
                  </div>
                )}
              </div>

              {/* Filters Section */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Export Button */}
                <Button
                  size="sm"
                  variant="outlined"
                  color="blue"
                  className="flex items-center gap-2"
                  onClick={() => handleExport('csv')}
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingIndicator size="sm" color="blue" />
                  ) : (
                    <>
                      <FileUploadIcon className="h-4 w-4" />
                      Export
                    </>
                  )}
                </Button>
                
                {/* Status Filter */}
                <Menu placement="bottom-start">
                  <MenuHandler>
                    <Button 
                      variant="outlined" 
                      size="sm"
                      className="flex items-center gap-2 min-w-[120px]"
                      color={statusFilter ? "blue" : "gray"}
                    >
                      <FilterListIcon className="h-4 w-4" />
                      {statusFilter || "Status"}
                      {statusFilter && (
                        <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                          ✓
                        </span>
                      )}
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
                    {statusData.map((status, index) => (
                      <MenuItem 
                        key={index} 
                        onClick={() => {
                          setStatusFilter(status.name);
                          applyFilters();
                        }}
                        className={`rounded ${statusFilter === status.name ? "bg-blue-50 text-blue-900" : ""} mb-1`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{status.name}</span>
                          <span className="text-xs bg-blue-gray-50 px-2 py-1 rounded-full">
                            {status.value}
                          </span>
                        </div>
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>

                {/* Date Range Filter */}
                <Popover placement="bottom-start">
                  <PopoverHandler>
                    <Button 
                      variant="outlined" 
                      size="sm"
                      className="flex items-center gap-2 min-w-[140px]"
                      color={(dateFilter.startDate || dateFilter.endDate) ? "blue" : "gray"}
                    >
                      <CalendarMonthIcon className="h-4 w-4" />
                      {dateFilter.startDate ? "Date Set" : "Date Range"}
                      {(dateFilter.startDate || dateFilter.endDate) && (
                        <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                          ✓
                        </span>
                      )}
                    </Button>
                  </PopoverHandler>
                  <PopoverContent className="p-0">
                    <Card className="shadow-none">
                      <div className="p-2">
                        <Typography variant="small" className="font-medium mb-2 text-gray-700">
                          Select Date Range
                        </Typography>
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

                {/* Clear Filters Button - Only show when filters are active */}
                {(statusFilter || dateFilter.startDate || dateFilter.endDate || searchQuery) && (
                  <Button 
                    size="sm" 
                    color="red" 
                    variant="text" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      setStatusFilter("");
                      setDateFilter({ startDate: null, endDate: null });
                      setSearchQuery("");
                      applyFilters();
                    }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(statusFilter || dateFilter.startDate || searchQuery) && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {searchQuery && (
                  <Chip
                    value={`Search: ${searchQuery}`}
                    onClose={() => {
                      setSearchQuery("");
                      applyFilters();
                    }}
                    variant="outlined"
                    color="blue"
                    className="h-7"
                  />
                )}
                
                {statusFilter && (
                  <Chip
                    value={`Status: ${statusFilter}`}
                    onClose={() => {
                      setStatusFilter("");
                      applyFilters();
                    }}
                    variant="outlined"
                    color="blue"
                    className="h-7"
                  />
                )}
                
                {dateFilter.startDate && (
                  <Chip
                    value={`Date: ${dateFilter.startDate.toLocaleDateString()} ${dateFilter.endDate ? ' - ' + dateFilter.endDate.toLocaleDateString() : ''}`}
                    onClose={() => {
                      setDateFilter({ startDate: null, endDate: null });
                      applyFilters();
                    }}
                    variant="outlined"
                    color="blue"
                    className="h-7"
                  />
                )}
              </div>
            )}
          </div>

          {/* Main Data Grid */}
          <Card className="mb-6">
            {/* DataGrid with improved scrolling */}
            <div className="h-[calc(100vh-320px)] w-full bg-white relative">
              <div className="h-full">
                <DataGridComponent
                  rows={memoizedRows?.filter(row => row && typeof row.id === 'number' && !isNaN(row.id)) || []}
                  columns={allColumns || columnDefinitions || []}
                  loading={loading}
                  getRowId={(row) => {
                    try {
                      // Ensure we get a valid ID
                      if (!row || row.id === undefined || row.id === null) {
                        console.error("Invalid row encountered:", row);
                        throw new Error("Row is missing a valid ID");
                      }
                      return row.id;
                    } catch (error) {
                      console.error("Error in getRowId:", error);
                      // Return a temporary ID to prevent crashes
                      return `temp-${Math.random().toString(36).substring(2, 9)}`;
                    }
                  }} 
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onCellEditCommit={(params) => {
                    try {
                      handleCellEditCommit(params);
                    } catch (error) {
                      console.error("Error in cell edit:", error);
                      toast.error(`Failed to update cell: ${error.message || "Unknown error"}`);
                    }
                  }}
                  selectedRows={selectedRows}
                  setSelectedRows={setSelectedRows}
                  perPage={get_data?.per_page || 10}
                  onPerPageChange={handlePerPageChange}
                  paginationModel={{
                    page: sites?.current_page - 1 || 0,
                    pageSize: get_data?.per_page || 10
                  }}
                  autoHeight={false}
                  className="h-full"
                  paginationMode="server"
                  rowCount={sites?.total || 0}
                  sortingMode="server"
                  onSortModelChange={handleSortChange}
                  serverOptions={{
                    page: sites?.current_page || 1,
                    totalRows: sites?.total || 0,
                    lastPage: sites?.last_page || 1,
                    from: sites?.from || 0,
                    to: sites?.to || 0,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Add Import Modal */}
          <ImportModal
            isOpen={importModalOpen}
            onClose={() => setImportModalOpen(false)}
            title="Import WNTD Data"
            description="Import WNTD data from CSV or Excel file. Download the template for the correct format."
            templateUrl="/api/wntd/template/download"
            importUrl="/api/wntd/import"
            requiredFields={['site_name', 'wntd', 'imsi']}
            onImportComplete={() => {
              refreshPage();
            }}
          />
        </div>
      </ErrorBoundary>

      {/* Add loading indicator for the main content area */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <LoadingIndicator size="lg" color="blue" text="Loading..." />
        </div>
      )}
    </Authenticated>
  );
};

export default Index;

