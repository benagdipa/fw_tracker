import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import { Card, Tabs, TabsHeader, Tab, Button, Dialog, DialogHeader, DialogFooter, Input, Select, Option, Alert, Typography, Checkbox, Spinner, Box, CircularProgress } from "@material-tailwind/react";
import toast from "react-hot-toast";
import axios from "axios";
import { DataGrid } from '@mui/x-data-grid';

// Components
import Authenticated from "@/Layouts/AuthenticatedLayout";
import DataGridComponent from "@/Components/DataGrid/DataGridComponent";
import "../../../css/data-grid-custom.css";
import LoadingIndicator from "@/Components/LoadingIndicator";
import StatsCard from "@/Components/StatsCard";
import ActionButton from '@/Components/ActionButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import DialogBodyWrapper from '@/Components/DialogBodyWrapper';
import ExportButton from '@/Components/ExportButton';
import InputWithIcon from "@/Components/InputWithIcon";
import SearchIcon from '@mui/icons-material/Search';
import ImportModal from '@/Components/BulkImport/ImportModal';

// Icons
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import LayersIcon from '@mui/icons-material/Layers';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import TableViewIcon from '@mui/icons-material/TableView';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DescriptionIcon from '@mui/icons-material/Description';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';

// Utilities
import { 
  handleCellEditCommit, 
  handleDelete, 
  handleSave, 
  handlePerPageChange,
  handleSearch,
  processColumns,
} from "@/Utils/GridUtils";

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`ran-tabpanel-${index}`}
            aria-labelledby={`ran-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const LoadingOverlay = () => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
        }}
    >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading data...</Typography>
    </Box>
);

const NoRowsOverlay = () => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
        }}
    >
        <Typography>No data available</Typography>
    </Box>
);

const Index = ({ auth }) => {
  const [loading, setLoading] = useState(true);
  const [structParamsData, setStructParamsData] = useState([]);
  const [paramsData, setParamsData] = useState([]);
  const [structParamsColumns, setStructParamsColumns] = useState([]);
  const [paramsColumns, setParamsColumns] = useState([]);
  const [activeTab, setActiveTab] = useState("structParameters");
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({
    totalParameters: 0,
    activeParameters: 0,
    technologyDistribution: {},
    uniqueTypes: 0
  });
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [currentRecord, setCurrentRecord] = useState(null);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Import modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importType, setImportType] = useState('parameters'); // or 'struct_parameters'

  useEffect(() => {
    const controller = new AbortController();
    
    fetchData().catch(error => {
      if (!axios.isCancel(error)) {
        console.error("Effect error:", error);
      }
    });
    
    return () => {
      controller.abort();
    };
  }, [activeTab, pageSize, searchText]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ran-configuration/excel-data', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        params: {
          search: searchText || '',
          per_page: pageSize || 10,
          type: activeTab === "structParameters" ? "struct_parameters" : "parameters",
          include_deleted: false // Add this parameter to explicitly exclude deleted records
        }
      });

      // Handle session expiration without auto-refresh
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        toast.error(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>Session expired. Please refresh the page.</span>
              <Button
                size="sm"
                color="blue"
                onClick={() => {
                  toast.dismiss(t.id);
                  window.location.reload();
                }}
              >
                Refresh Page
              </Button>
            </div>
          ),
          { duration: 0 }
        );
        setStructParamsData([]);
        setParamsData([]);
        return;
      }

      if (response.data.success) {
        const { structParameters, parameters, stats } = response.data.data || {};
        
        if (activeTab === "structParameters" && structParameters?.data) {
          const processedStructData = structParameters.data.map(item => ({
            id: item.id || 0,
            model: item.model || '',
            mo_class_name: item.mo_class_name || '',
            parameter_name: item.parameter_name || '',
            seq: item.seq ? parseInt(item.seq) : null,
            parameter_description: item.parameter_description || '',
            data_type: item.data_type || '',
            range: item.range || '',
            def: item.def || '',
            mul: Boolean(item.mul),
            unit: item.unit || '',
            rest: item.rest || '',
            read: item.read || '',
            restr: item.restr || '',
            manc: item.manc || '',
            pers: item.pers || '',
            syst: item.syst || '',
            change: item.change || '',
            dist: item.dist || '',
            dependencies: item.dependencies || '',
            dep: item.dep || '',
            obs: item.obs || '',
            prec: item.prec || '',
            status: item.status || 'active',
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString()
          })).filter(item => item.id > 0); // Filter out any items with invalid IDs
          
          setStructParamsData(processedStructData);
        }
        
        if (activeTab === "parameters" && parameters?.data) {
          const processedParamData = parameters.data.map(item => ({
            id: item.id || 0,
            parameter_id: item.parameter_id || '',
            parameter_name: item.parameter_name || '',
            parameter_value: item.parameter_value || '',
            description: item.description || '',
            domain: item.domain || '',
            data_type: item.data_type || '',
            mo_reference: item.mo_reference || '',
            default_value: item.default_value || '',
            category: item.category || '',
            technology: item.technology || '',
            vendor: item.vendor || '',
            applicability: item.applicability || '',
            status: item.status || 'active',
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString()
          })).filter(item => item.id > 0); // Filter out any items with invalid IDs
          
          setParamsData(processedParamData);
        }
        
        setStats(stats || {
          totalParameters: 0,
          activeParameters: 0,
          technologyDistribution: {},
          uniqueTypes: 0
        });
      } else {
        console.error("API Response:", response.data);
        const errorMessage = response.data?.message || "Failed to load RAN Configuration data";
        
        // Check for specific database errors
        if (errorMessage.includes('SQLSTATE[42703]')) {
          toast.error(
            (t) => (
              <div className="flex flex-col gap-2">
                <span>Database schema error detected.</span>
                <span className="text-xs text-gray-500">Please run database migrations or contact administrator.</span>
                <Button
                  size="sm"
                  color="blue"
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.location.reload();
                  }}
                >
                  Refresh Page
                </Button>
              </div>
            ),
            { duration: 0 }
          );
        } else {
          toast.error(errorMessage);
        }
        
        if (activeTab === "structParameters") {
          setStructParamsData([]);
        } else {
          setParamsData([]);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      
      // Check if it's a database schema error
      if (error.response?.data?.message?.includes('SQLSTATE[42703]')) {
        toast.error(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>Database schema error detected.</span>
              <span className="text-xs text-gray-500">Please run database migrations or contact administrator.</span>
              <Button
                size="sm"
                color="blue"
                onClick={() => {
                  toast.dismiss(t.id);
                  window.location.reload();
                }}
              >
                Refresh Page
              </Button>
            </div>
          ),
          { duration: 0 }
        );
      }
      
      setStructParamsData([]);
      setParamsData([]);
    } finally {
      setLoading(false);
    }
  };

  // Separate function to process data to improve performance
  const processData = (responseData) => {
    // Process StructParameters data
    const structParams = responseData.structParameters || [];
    const structParamsDataArray = structParams.data || [];
    
    // Add id if not present for DataGrid - only process what's needed
    const structParamsWithIds = structParamsDataArray.map((item, index) => ({
      ...item,
      id: item.id || index + 1
    }));
    
    setStructParamsData(structParamsWithIds);
    
    if (structParamsColumns.length === 0) {
      // Only set columns if they haven't been set yet
      setStructParamsColumns(getStructParamsColumns());
    }
    
    // Process Parameters data
    const params = responseData.parameters || [];
    const paramsDataArray = params.data || [];
    
    // Add id if not present for DataGrid
    const paramsWithIds = paramsDataArray.map((item, index) => ({
      ...item,
      id: item.id || index + 1
    }));
    
    setParamsData(paramsWithIds);
    
    if (paramsColumns.length === 0) {
      // Only set columns if they haven't been set yet
      setParamsColumns(getParamsColumns());
    }
    
    // Calculate stats
    calculateStats(paramsWithIds);
  };

  // Extract columns definition to separate functions to avoid recreating on every render
  const getStructParamsColumns = () => [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'parameter_name', headerName: 'Parameter Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 250 },
    { field: 'data_type', headerName: 'Data Type', width: 120 },
    { field: 'value_range', headerName: 'Value Range', width: 150 },
    { field: 'default_value', headerName: 'Default Value', width: 120 },
    { field: 'unit', headerName: 'Unit', width: 100 },
    { field: 'technology', headerName: 'Technology', width: 120 },
    { field: 'vendor', headerName: 'Vendor', width: 120 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <div className={`px-3 py-1 rounded-full text-sm ${
          params.value === 'active' ? 'bg-green-100 text-green-800' :
          params.value === 'inactive' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {params.value}
        </div>
      )
    },
    { 
      field: 'created_at', 
      headerName: 'Created At', 
      width: 180,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleString();
      }
    },
    { 
      field: 'updated_at', 
      headerName: 'Updated At', 
      width: 180,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleString();
      }
    }
  ];

  const getParamsColumns = () => [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'parameter_name', headerName: 'Parameter Name', width: 200 },
    { field: 'value', headerName: 'Value', width: 150 },
    { field: 'description', headerName: 'Description', width: 250 },
    { field: 'data_type', headerName: 'Data Type', width: 120 },
    { field: 'value_range', headerName: 'Value Range', width: 150 },
    { field: 'default_value', headerName: 'Default Value', width: 120 },
    { field: 'unit', headerName: 'Unit', width: 100 },
    { field: 'technology', headerName: 'Technology', width: 120 },
    { field: 'vendor', headerName: 'Vendor', width: 120 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <div className={`px-3 py-1 rounded-full text-sm ${
          params.value === 'active' ? 'bg-green-100 text-green-800' :
          params.value === 'inactive' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {params.value}
        </div>
      )
    },
    { 
      field: 'created_at', 
      headerName: 'Created At', 
      width: 180,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleString();
      }
    },
    { 
      field: 'updated_at', 
      headerName: 'Updated At', 
      width: 180,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleString();
      }
    }
  ];

  // Calculate statistics from the data
  const calculateStats = (data) => {
    if (!data || data.length === 0) return;
    
    // Count total parameters
    const totalParams = data.length;
    
    // Count active parameters
    const activeParams = data.filter(item => item.status?.toLowerCase() === 'active').length;
    
    // Count parameters by technology
    const techCounts = {};
    data.forEach(item => {
      if (item.technology) {
        techCounts[item.technology] = (techCounts[item.technology] || 0) + 1;
      }
    });
    
    // Count unique parameter types
    const uniqueTypes = new Set(data.map(item => item.data_type).filter(Boolean)).size;
    
    setStats({
      totalParameters: totalParams,
      activeParameters: activeParams,
      technologyDistribution: techCounts,
      uniqueTypes: uniqueTypes
    });
  };

  const handleEdit = (row) => {
    setCurrentRecord(row);
    setDialogType(activeTab === "structParameters" ? 'editStructParam' : 'editParam');
    setOpenDialog(true);
  };

  const handleAdd = () => {
    // Set empty record based on active tab
    if (activeTab === "structParameters") {
      setCurrentRecord({
        model: '',
        mo_class_name: '',
        parameter_name: '',
        seq: 0,
        parameter_description: '',
        data_type: '',
        range: '',
        def: '',
        mul: false,
        unit: '',
        rest: '',
        read: '',
        restr: '',
        manc: '',
        pers: '',
        syst: '',
        change: '',
        dist: '',
        dependencies: '',
        dep: '',
        obs: '',
        prec: ''
      });
      setDialogType('addStructParam');
    } else {
      setCurrentRecord({
        parameter_id: '',
        parameter_name: '',
        parameter_value: '',
        description: '',
        domain: '',
        data_type: '',
        mo_reference: '',
        default_value: '',
        category: '',
        technology: '',
        vendor: '',
        applicability: '',
        status: 'Active'
      });
      setDialogType('addParam');
    }
    setOpenDialog(true);
  };

  const handleSaveRecord = async () => {
    try {
      const isAdd = dialogType === 'addStructParam' || dialogType === 'addParam';
      const isStructParam = dialogType === 'addStructParam' || dialogType === 'editStructParam';
      
      // Determine which endpoint to call based on action and record type
      const endpoint = isStructParam
        ? (isAdd ? '/api/ran-configuration/struct-parameters/create' : '/api/ran-configuration/struct-parameters/update')
        : (isAdd ? '/api/ran-configuration/parameters/create' : '/api/ran-configuration/parameters/update');
      
      const response = await axios.post(endpoint, currentRecord);
      
      if (response.data.success) {
        toast.success(isAdd ? "Record created successfully" : "Record updated successfully");
        setOpenDialog(false);
        // Refresh data
        fetchData();
      } else {
        toast.error("Failed to save record: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving record:", error);
      toast.error("An error occurred while saving: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveRow = async (row) => {
    if (!row) return;
    
    setLoading(true);
    const loadingToast = toast.loading("Saving changes...");
    
    try {
      const response = await axios.post('/api/ran-configuration/parameters/update', { data: row });
      
      toast.dismiss(loadingToast);
      
      if (response.data && response.data.success) {
        toast.success("Record updated successfully");
        
        // Update local state with the newly saved data
        if (row.type === 'param') {
          setParamsData(paramsData.map(p => p.id === row.id ? { ...p, ...row, updated_at: new Date().toISOString() } : p));
        } else {
          setStructParamsData(structParamsData.map(p => p.id === row.id ? { ...p, ...row, updated_at: new Date().toISOString() } : p));
        }
      } else {
        toast.error(response.data?.message || "Failed to update record");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Save error:", error);
      toast.error("Failed to update record: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = (row) => {
    setSelectedRow(row);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRow) {
      setDeleteDialogOpen(false);
      return;
    }
    
    setLoading(true);
    const loadingToast = toast.loading("Deleting record...");
    
    try {
      const response = await axios.delete(`/api/ran-configuration/parameters/delete?id=${selectedRow.id}`);
      
      toast.dismiss(loadingToast);
      
      if (response.data && response.data.success) {
        // Update local state to remove deleted record
        if (selectedRow.type === 'param') {
          setParamsData(paramsData.filter(p => p.id !== selectedRow.id));
        } else {
          setStructParamsData(structParamsData.filter(p => p.id !== selectedRow.id));
        }
        
        toast.success("Record deleted successfully");
      } else {
        toast.error(response.data?.message || "Failed to delete record");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Delete error:", error);
      
      if (error.response?.status === 403) {
        toast.error("You do not have permission to delete this record");
      } else if (error.response?.status === 404) {
        toast.error("Record not found");
        // Update UI anyway if server says record doesn't exist
        if (selectedRow.type === 'param') {
          setParamsData(paramsData.filter(p => p.id !== selectedRow.id));
        } else {
          setStructParamsData(structParamsData.filter(p => p.id !== selectedRow.id));
        }
      } else {
        toast.error("Failed to delete record: " + (error.response?.data?.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedRow(null);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value || '');
  };

  // Function to filter data based on search text
  const filteredStructParamsData = searchText 
    ? structParamsData.filter(row => 
        Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      )
    : structParamsData;

  const filteredParamsData = searchText 
    ? paramsData.filter(row => 
        Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      )
    : paramsData;

  // Helper to get the most common values for a given property
  const getTopValues = (obj, limit = 3) => {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, value]) => `${key} (${value})`);
  };

  const handleExport = async (format) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/ran-configuration/export?format=${format}`, {
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format.toLowerCase();
      link.setAttribute('download', `ran_configuration_${new Date().toISOString().split('T')[0]}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('An error occurred while exporting data');
    } finally {
      setLoading(false);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <Authenticated auth={auth} errors={{}}>
      <Head title="RAN Configuration" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-0">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                <StatsCard
                  title="Total Parameters"
                  value={stats.totalParameters || 0}
                  icon={<SettingsInputAntennaIcon className="h-5 w-5" />}
                  color="blue"
                  tooltip="Total number of RAN parameters"
                >
                  Total Parameters
                </StatsCard>
                <StatsCard
                  title="Active Parameters"
                  value={stats.activeParameters || 0}
                  icon={<CheckCircleIcon className="h-5 w-5" />}
                  color="green"
                  tooltip="Number of active parameters"
                >
                  Active Parameters
                </StatsCard>
                <StatsCard
                  title="Technologies"
                  value={Object.keys(stats.technologyDistribution || {}).length}
                  icon={<BarChartIcon className="h-5 w-5" />}
                  color="amber"
                  tooltip={`Technologies: ${Object.keys(stats.technologyDistribution || {}).join(', ')}`}
                >
                  Technologies
                </StatsCard>
                <StatsCard
                  title="Parameter Types"
                  value={stats.uniqueTypes || 0}
                  icon={<LayersIcon className="h-5 w-5" />}
                  color="purple"
                  tooltip="Number of unique parameter data types"
                >
                  Parameter Types
                </StatsCard>
              </div>

              {/* Search and Actions */}
              <div className="px-6 pb-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-96">
                    <InputWithIcon
                      icon={<SearchIcon className="h-5 w-5 text-gray-400" />}
                      placeholder="Search parameters..."
                      value={searchText}
                      onChange={handleSearchChange}
                      className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                    {searchText && (
                      <div className="mt-1 text-xs text-gray-500">
                        Search by: parameter name, ID, value, description
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Import Button */}
                    <Button
                      size="sm"
                      variant="outlined"
                      color="blue"
                      className="flex items-center gap-2"
                      onClick={() => {
                        setImportType(activeTab === "structParameters" ? "struct_parameters" : "parameters");
                        setImportModalOpen(true);
                      }}
                    >
                      <DownloadIcon className="h-4 w-4" />
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
                  </div>
                </div>
              </div>

              {/* Tabs and Data Grid */}
              <div className="px-6">
                <Card className="overflow-hidden">
                  <Tabs value={activeTab} className="w-full">
                    <TabsHeader>
                      <Tab
                        value="structParameters"
                        onClick={() => setActiveTab("structParameters")}
                        className={`${activeTab === "structParameters" ? "font-medium" : ""} px-4 py-2`}
                      >
                        Struct Parameters
                      </Tab>
                      <Tab
                        value="parameters"
                        onClick={() => setActiveTab("parameters")}
                        className={`${activeTab === "parameters" ? "font-medium" : ""} px-4 py-2`}
                      >
                        Parameters
                      </Tab>
                    </TabsHeader>
                  </Tabs>

                  <div className="border rounded-lg overflow-hidden mt-4">
                    <DataGrid
                      rows={(activeTab === "structParameters" ? filteredStructParamsData : filteredParamsData).filter(row => row && row.id != null)}
                      columns={(activeTab === "structParameters" ? getStructParamsColumns() : getParamsColumns()).filter(col => col && col.field && !['actions'].includes(col.field))}
                      loading={loading}
                      getRowId={(row) => row.id}
                      className="bg-white dark:bg-gray-800"
                      rowsPerPageOptions={[100]}
                      initialState={{
                        pagination: {
                          pageSize: 100,
                        },
                      }}
                      components={{
                        LoadingOverlay: LoadingOverlay,
                        NoRowsOverlay: NoRowsOverlay,
                      }}
                    />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} handler={() => setDeleteDialogOpen(false)}>
          <DialogHeader>Confirm Delete</DialogHeader>
          <DialogBodyWrapper>
            Are you sure you want to delete this record? This action cannot be undone.
          </DialogBodyWrapper>
          <DialogFooter>
            <Button
              variant="text"
              color="gray"
              onClick={() => setDeleteDialogOpen(false)}
              className="mr-1"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              color="red"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </Dialog>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-50 flex items-center justify-center">
            <LoadingIndicator />
          </div>
        )}

        {/* Import Modal */}
        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          title={`Import ${importType === 'parameters' ? 'Parameters' : 'Struct Parameters'}`}
          description="Import RAN configuration data from CSV file. Download the template for the correct format."
          templateUrl={importType === 'parameters' ? '/templates/ran_parameters_template.csv' : '/templates/ran_struct_parameters_template.csv'}
          importUrl={route('ran.configuration.import.file')}
          requiredFields={
            importType === 'parameters' 
              ? [
                  'parameter_id',
                  'parameter_name',
                  'parameter_value',
                  'description',
                  'domain',
                  'data_type',
                  'value_range',
                  'mo_reference',
                  'default_value',
                  'category',
                  'technology',
                  'vendor',
                  'applicability',
                  'status',
                  'type',
                  'value',
                  'unit'
                ]
              : [
                  'model',
                  'mo_class_name',
                  'parameter_name',
                  'seq',
                  'technology',
                  'vendor',
                  'status'
                ]
          }
          onImportComplete={() => {
            refreshPage();
          }}
        />
      </div>
    </Authenticated>
  );
};

export default Index;