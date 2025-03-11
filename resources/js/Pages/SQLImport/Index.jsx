import React, { useEffect, useState, useRef, useCallback } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Typography, 
  Button, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Spinner,
  Chip,
  Select,
  Option,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Badge
} from "@material-tailwind/react";
import axios from "axios";
import { toast } from "react-hot-toast";

// Components
import Authenticated from "@/Layouts/AuthenticatedLayout";
import SQLEditor from "@/Components/SQLEditor";
import TableBrowser from "@/Components/TableBrowser";
import QueryResultsTable from "@/Components/QueryResultsTable";

// Icons
import { 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon, 
  BookmarkIcon,
  DocumentDuplicateIcon,
  ServerIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChartBarIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ClockIcon,
  BoltIcon,
  CircleStackIcon,
  CursorArrowRaysIcon,
  CommandLineIcon,
  CircleStackIcon as DatabaseIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  CodeBracketIcon,
  PencilSquareIcon,
  PlayCircleIcon,
  ArrowLeftCircleIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PlayIcon,
  CalendarIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  FolderIcon as DirectoryIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

// Import FolderIcon separately to avoid conflicts
import { FolderIcon } from "@heroicons/react/24/outline";

// Add debounce utility at the top of the file
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Add ErrorBoundary component at the top of the file
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SQL Explorer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <h2 className="font-semibold">Something went wrong</h2>
          </div>
          <p className="mt-2 text-sm text-red-600">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            color="red"
            variant="text"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

function SQLExplorerComponent({ auth, tablesNames, columnsName, dbtype }) {
  const { props } = usePage();
  const [query, setQuery] = useState("");
  const [savedQueries, setSavedQueries] = useState([]);
  const [tablesList, setTablesList] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);  
  const [columnsList, setColumnsList] = useState({});
  const [selectedTableName, setSelectedTableName] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [queryResults, setQueryResults] = useState([]);
  const [affectedRows, setAffectedRows] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);
  const [gridColumns, setGridColumns] = useState([]);
  const [gridRows, setGridRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSavingQuery, setIsSavingQuery] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [isTablePanelVisible, setIsTablePanelVisible] = useState(true);
  const [isSaveQueryDialogOpen, setIsSaveQueryDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState("");
  const [queryDescription, setQueryDescription] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("query");
  const [queryStats, setQueryStats] = useState({
    totalQueries: 0,
    avgExecutionTime: 0,
    successRate: 100,
    lastExecutionTime: null
  });
  const [catalog, setCatalog] = useState("");
  const [schema, setSchema] = useState("");
  const [availableCatalogs, setAvailableCatalogs] = useState([]);
  const [availableSchemas, setAvailableSchemas] = useState([]);
  
  // Add loading state for initial data
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Get database ID safely
  const databaseId = props?.params?.id;

  // Initialize state from props
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsInitialLoading(true);
        
        if (tablesNames?.length) {
          setTablesList(tablesNames);
          setFilteredTables(tablesNames);
        }
        
        if (columnsName) {
          setColumnsList(columnsName);
        }

        if (dbtype === 'starburst' && databaseId) {
          await loadCatalogs();
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load initial data');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, [tablesNames, columnsName, dbtype, databaseId]);

  // Load available catalogs
  const loadCatalogs = async () => {
    try {
      if (!databaseId) {
        console.warn('No database ID provided for loading catalogs');
        return;
      }

      const response = await axios.get(route('sql.catalogs', [databaseId]));
      if (response.data.catalogs) {
        setAvailableCatalogs(response.data.catalogs);
      }
    } catch (error) {
      console.error("Error loading catalogs:", error);
      toast.error("Failed to load available catalogs");
    }
  };

  // Load schemas for selected catalog
  const loadSchemas = async (selectedCatalog) => {
    if (!selectedCatalog || !databaseId) {
      console.warn('No catalog or database ID provided for loading schemas');
      return;
    }
    
    try {
      const response = await axios.get(route('sql.schemas', [databaseId]), {
        params: { catalog: selectedCatalog }
      });
      if (response.data.schemas) {
        setAvailableSchemas(response.data.schemas);
      }
    } catch (error) {
      console.error("Error loading schemas:", error);
      toast.error("Failed to load available schemas");
    }
  };

  // Handle catalog change
  const handleCatalogChange = (value) => {
    setCatalog(value);
    setSchema("");
    setAvailableSchemas([]);
    loadSchemas(value);
  };

  // Enhanced error handling for query execution
  const handleQueryError = (error) => {
    console.error("Query execution error:", error);
    const errorMessage = error.response?.data?.error?.message || "Failed to execute query";
    const errorType = error.response?.data?.error?.type;
    
    setErrorMsg(errorMessage);
    
    // Starburst-specific error handling
    if (dbtype === 'starburst') {
      if (errorMessage.includes('Catalog')) {
        toast.error("Invalid catalog selected. Please check your catalog configuration.");
      } else if (errorMessage.includes('Schema')) {
        toast.error("Invalid schema selected. Please check your schema configuration.");
      } else if (errorMessage.includes('Table')) {
        toast.error("Table not found. Please check if the table exists in the selected catalog and schema.");
      } else if (errorMessage.includes('Permission')) {
        toast.error("Permission denied. Please check your access rights.");
      } else if (errorMessage.includes('Syntax')) {
        toast.error("SQL syntax error. Please check your query.");
      } else {
        toast.error('Query execution failed. Check the error message below.');
      }
    } else {
      if (errorType === 'validation_error') {
        toast.error(errorMessage);
      } else {
        toast.error('Query execution failed. Check the error message below.');
      }
    }
  };

  // Add memoized handlers
  const debouncedSearch = useRef(
    debounce((value) => {
      if (!value?.trim()) {
        setFilteredTables(tablesList || []);
      } else {
        const lowercaseSearch = value.toLowerCase();
        const filtered = (tablesList || []).filter(table => 
          table && typeof table === 'string' && table.toLowerCase().includes(lowercaseSearch)
        );
        setFilteredTables(filtered);
        
        if (filtered.length === 0) {
          toast.info("No tables found matching your search");
        }
      }
    }, 300)
  ).current;

  // Optimize parseResponseData function
  const parseResponseData = useCallback((data) => {
    if (!data || !data.length) return { columns: [], rows: [] };
    
    const headers = Array.isArray(data[0]) 
      ? data[0] 
      : typeof data[0] === 'object' 
        ? Object.keys(data[0]) 
        : [];
    
    const columns = headers.map((header, index) => ({
      field: typeof header === 'string' 
        ? header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() 
        : `col_${index}`,
      headerName: header,
      width: 150,
      editable: false,
    }));
    
    let rows = [];
    const isArrayFormat = Array.isArray(data[0]);
    
    if (isArrayFormat && data.length > 0) {
      rows = data.slice(1).map((row, i) => {
        const rowObj = { id: i + 1 };
        row.forEach((value, index) => {
          rowObj[columns[index]?.field || `col_${index}`] = value;
        });
        return rowObj;
      });
    } else if (typeof data[0] === 'object') {
      rows = data.map((item, index) => ({
        id: item.id || index + 1,
        ...item
      }));
    }
    
    return { columns, rows };
  }, []);

  // Optimize loadMoreTables
  const loadMoreTables = useCallback(async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const nextPage = page + 1;
      
      const response = await axios.get(route('tables.index'), {
        params: {
          id: databaseId,
          page: nextPage,
          search: searchTerm
        }
      });
      
      if (response.data.tables) {
        const newTables = response.data.tables.filter(
          (table) => !tablesList.some((existingTable) => existingTable.name === table.name)
        );
        
        if (newTables.length > 0) {
          setTablesList(prev => [...prev, ...newTables]);
          setFilteredTables(prev => [...prev, ...newTables]);
          setPage(nextPage);
          
          toast.success(`Loaded ${newTables.length} more tables`);
        } else {
          toast.info("No new tables found");
        }
        
        if (newTables.length < 10) {
          toast.info("All tables have been loaded");
        }
      }
    } catch (error) {
      console.error("Error loading more tables:", error);
      toast.error(error.response?.data?.error?.message || "Failed to load additional tables");
      setErrorMsg(error.response?.data?.error?.message || "Failed to load additional tables");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, page, databaseId, searchTerm, tablesList]);

  // Optimize handleSearchChange
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Optimize executeQuery function
  const executeQuery = useCallback(async () => {
    if (!query.trim()) {
      toast.error("Please enter a SQL query");
      return;
    }
    
    if (!databaseId) {
      toast.error("Database connection not available");
      return;
    }

    if (dbtype === 'starburst' && (!catalog || !schema)) {
      toast.error("Please select both catalog and schema for Starburst");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg("");
    setGridColumns([]);
    setGridRows([]);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await axios.post(route('sql.run'), {
        id: databaseId,
        sql_query: query,
        table_name: selectedTableName || "",
        catalog: catalog,
        schema: schema
      }, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.error) {
        handleQueryError({ response: { data: { error: response.data.error } } });
      } else {
        setExecutionTime(response.data.executionTime || 0);
        setAffectedRows(response.data.rowCount || 0);
        
        const { columns, rows } = parseResponseData(response.data.data);
        
        setGridColumns(columns);
        setGridRows(rows);
        setQueryResults(response.data.data);
        
        setQueryStats(prev => ({
          ...prev,
          totalQueries: prev.totalQueries + 1,
          avgExecutionTime: (prev.avgExecutionTime * prev.totalQueries + response.data.executionTime) / (prev.totalQueries + 1),
          lastExecutionTime: new Date().toISOString()
        }));
        
        toast.success(`Query executed successfully in ${response.data.executionTime}ms`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Query execution timed out after 30 seconds');
        setErrorMsg('Query execution timed out. Please try a more optimized query.');
      } else {
        handleQueryError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [query, databaseId, selectedTableName, catalog, schema, parseResponseData, dbtype]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup any pending operations
      setQuery("");
      setQueryResults([]);
      setGridColumns([]);
      setGridRows([]);
    };
  }, []);

  // Handle running a query on a table
  const handleRunTableQuery = (tableName) => {
    setSelectedTableName(tableName);
    setQuery(`SELECT * FROM ${tableName} LIMIT 100`);
    executeQuery();
  };

  // Handle selecting a table
  const handleSelectTable = (tableName) => {
    setSelectedTableName(tableName);
  };

  // Toggle table panel visibility
  const toggleTablePanel = () => {
    setIsTablePanelVisible(!isTablePanelVisible);
  };

  // Save a query for later use
  const saveQuery = async () => {
    if (!query.trim()) {
      toast.error("Cannot save empty query");
      return;
    }
    
    if (!queryName.trim()) {
      toast.error("Please provide a name for your query");
      return;
    }
    
    if (!databaseId) {
      toast.error("Database connection not available");
      return;
    }
    
    setIsSavingQuery(true);
    
    try {
      const response = await axios.post(route('sql.store'), {
        id: databaseId,
        name: queryName,
        description: queryDescription,
        query: query
      });
      
      if (response.data.success) {
        toast.success("Query saved successfully");
        setIsSaveQueryDialogOpen(false);
        
        // Reset form fields
        setQueryName("");
        setQueryDescription("");
        
        // Add to saved queries list
        setSavedQueries(prev => [{
          id: Date.now(),
          name: queryName,
          description: queryDescription,
          query: query
        }, ...prev]);
      } else {
        toast.error(response.data.error || "Failed to save query");
      }
    } catch (error) {
      console.error("Error saving query:", error);
      toast.error(error.response?.data?.error?.message || "Failed to save query");
    } finally {
      setIsSavingQuery(false);
    }
  };

  return (
    <Authenticated user={auth.user}>
      <Head title="SQL Explorer" />
      
      {isInitialLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Spinner className="h-16 w-16 mx-auto mb-6 text-blue-500" />
            <Typography variant="h5" color="blue-gray" className="font-medium">
              Loading SQL Explorer...
            </Typography>
            <Typography variant="small" color="gray" className="mt-2 max-w-xs mx-auto">
              Preparing your database connection and retrieving available tables
            </Typography>
          </div>
        </div>
      ) : !databaseId ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-100">
            <DatabaseIcon className="h-16 w-16 mx-auto mb-6 text-red-500" />
            <Typography variant="h5" color="blue-gray" className="font-medium mb-2">
              No Database Connection
            </Typography>
            <Typography variant="small" color="gray" className="mb-6">
              Please connect to a database to use the SQL Explorer
            </Typography>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                color="blue"
                className="flex items-center gap-2"
                onClick={() => router.visit(route('settings.index'))}
              >
                <PlusIcon className="h-4 w-4" />
                Add New Connection
              </Button>
              <Button
                variant="outlined"
                color="blue"
                className="flex items-center gap-2"
                onClick={() => router.visit(route('settings.index'))}
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit Connections
              </Button>
            </div>
            <Button
              variant="text"
              color="gray"
              className="mt-4"
              onClick={() => router.visit('/')}
            >
              Go to Home
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                    <CodeBracketIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <Typography variant="h4" color="blue-gray" className="font-bold">
                      {dbtype === 'starburst' ? 'Starburst SQL Explorer' : 'SQL Explorer'}
                    </Typography>
                    <Typography variant="small" color="gray" className="mt-1">
                      Explore and analyze your {dbtype === 'starburst' ? 'Starburst' : dbtype} database with powerful SQL queries
                    </Typography>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Tooltip content={databaseId ? "Connected to database" : "Database not connected"}>
                  <Chip
                    value={databaseId ? "Database Connected" : "No Database Connection"}
                    size="sm"
                    className="px-3"
                    variant="gradient"
                    color={databaseId ? "green" : "red"}
                    icon={
                      <div className="p-1 rounded-full">
                        <DatabaseIcon className="h-3 w-3" />
                      </div>
                    }
                  />
                </Tooltip>
                
                {dbtype === 'starburst' && (
                  <Tooltip content="Connected to Starburst">
                    <Chip
                      value="Starburst Connected"
                      size="sm"
                      variant="gradient"
                      color="blue"
                      className="px-3"
                      icon={
                        <div className="p-1 rounded-full">
                          <BoltIcon className="h-3 w-3" />
                        </div>
                      }
                    />
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="small" color="gray" className="font-medium">
                      Total Tables
                    </Typography>
                    <Typography variant="h5" color="blue-gray" className="mt-1">
                      {tablesList.length}
                    </Typography>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-full">
                    <TableCellsIcon className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="small" color="gray" className="font-medium">
                      Queries Today
                    </Typography>
                    <Typography variant="h5" color="blue-gray" className="mt-1">
                      {queryStats.totalQueries}
                    </Typography>
                  </div>
                  <div className="p-2 bg-green-50 rounded-full">
                    <BoltIcon className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="small" color="gray" className="font-medium">
                      Avg. Execution Time
                    </Typography>
                    <Typography variant="h5" color="blue-gray" className="mt-1">
                      {queryStats.avgExecutionTime.toFixed(2)}ms
                    </Typography>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-full">
                    <ClockIcon className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="small" color="gray" className="font-medium">
                      Success Rate
                    </Typography>
                    <Typography variant="h5" color="blue-gray" className="mt-1">
                      {queryStats.successRate}%
                    </Typography>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-full">
                    <CheckCircleIcon className="h-6 w-6 text-indigo-500" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Tables Panel */}
            <div className={`lg:col-span-1 ${isTablePanelVisible ? 'block' : 'hidden lg:block'}`}>
              <Card className="bg-white h-full shadow-sm">
                <CardHeader color="blue-gray" className="p-4 flex justify-between items-center shadow-none">
                  <Typography variant="h6" color="blue-gray" className="flex items-center gap-2">
                    <TableCellsIcon className="h-5 w-5 text-blue-500" /> 
                    Tables
                  </Typography>
                  <div className="hidden lg:block">
                    <IconButton
                      variant="text"
                      color="blue-gray"
                      onClick={toggleTablePanel}
                      className="p-2"
                    >
                      <ArrowLeftCircleIcon className="h-5 w-5" />
                    </IconButton>
                  </div>
                </CardHeader>

                <CardBody className="p-0">
                  <div className="p-4 border-b border-gray-200">
                    <Input
                      type="text"
                      label="Search tables"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      icon={<MagnifyingGlassIcon className="h-5 w-5 text-blue-gray-300" />}
                      className="!border-t-blue-gray-200 focus:!border-blue-500"
                    />
                  </div>
                  
                  {dbtype === 'starburst' && (
                    <div className="p-4 border-b border-gray-200 space-y-3">
                      <div>
                        <Typography variant="small" color="blue-gray" className="mb-1 font-medium">
                          Select Catalog
                        </Typography>
                        <Select
                          value={catalog}
                          onChange={handleCatalogChange}
                          label="Select Catalog"
                          className="sm:w-48"
                          disabled={isLoadingTables}
                        >
                          <Option value="">Select a catalog</Option>
                          {availableCatalogs.map((cat) => (
                            <Option key={cat} value={cat}>
                              {cat}
                            </Option>
                          ))}
                        </Select>
                      </div>
                      
                      {catalog && (
                        <div>
                          <Typography variant="small" color="blue-gray" className="mb-1 font-medium">
                            Select Schema
                          </Typography>
                          <Select
                            value={schema}
                            onChange={(value) => setSchema(value)}
                            label="Select Schema"
                            className="sm:w-48"
                            disabled={isLoadingTables}
                          >
                            <Option value="">Select a schema</Option>
                            {availableSchemas.map((sch) => (
                              <Option key={sch} value={sch}>
                                {sch}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="overflow-y-auto max-h-[calc(100vh-24rem)]">
                    {isLoadingTables ? (
                      <div className="p-8 text-center">
                        <Spinner className="h-8 w-8 mx-auto mb-4" />
                        <Typography variant="small" color="gray">
                          Loading tables...
                        </Typography>
                      </div>
                    ) : filteredTables.length === 0 ? (
                      <div className="p-8 text-center">
                        <FolderIcon className="h-12 w-12 mx-auto mb-4 text-blue-gray-200" />
                        <Typography variant="small" color="gray">
                          No tables found
                        </Typography>
                        <Typography variant="small" color="gray" className="mt-1">
                          {searchTerm ? 'Try a different search term' : 'Connect to a database to view tables'}
                        </Typography>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {filteredTables.map((table, index) => (
                          <li 
                            key={index}
                            className={`hover:bg-gray-50 transition-colors ${selectedTableName === table ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex justify-between items-center p-3">
                              <button
                                className="text-left w-full flex items-center gap-2"
                                onClick={() => handleSelectTable(table)}
                              >
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {table}
                                </span>
                              </button>
                              <div className="flex-shrink-0">
                                <Tooltip content="Run SELECT Query">
                                  <IconButton
                                    variant="text"
                                    color="blue-gray"
                                    onClick={() => handleRunTableQuery(table)}
                                    className="h-8 w-8"
                                  >
                                    <PlayCircleIcon className="h-5 w-5 text-blue-500" />
                                  </IconButton>
                                </Tooltip>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {tablesList.length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                      <Button
                        variant="outlined"
                        color="blue"
                        fullWidth
                        className="flex items-center justify-center gap-2"
                        onClick={loadMoreTables}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? (
                          <>
                            <Spinner className="h-4 w-4" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Load More Tables
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
            
            {/* SQL Editor and Results Panel */}
            <div className="lg:col-span-3">
              <Card className="bg-white shadow-sm h-full">
                <CardHeader color="blue-gray" className="p-4 shadow-none">
                  <Tabs value={activeTab} className="min-w-full">
                    <TabsHeader className="rounded-lg bg-gray-100 p-1">
                      <Tab value="query" className="rounded-md py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <PencilSquareIcon className="h-4 w-4" />
                          Query Editor
                        </div>
                      </Tab>
                      <Tab value="results" className="rounded-md py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <TableCellsIcon className="h-4 w-4" />
                          Results
                        </div>
                      </Tab>
                      <Tab value="stats" className="rounded-md py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <ChartBarIcon className="h-4 w-4" />
                          Statistics
                        </div>
                      </Tab>
                    </TabsHeader>
                  </Tabs>
                </CardHeader>
                
                <CardBody className="p-0">
                  {activeTab === "query" && (
                    <div className="p-4">
                      <div className="mb-4">
                        <Typography variant="h6" color="blue-gray" className="flex items-center gap-2 mb-3">
                          <CommandLineIcon className="h-5 w-5 text-blue-500" />
                          SQL Query
                        </Typography>
                        
                        <div className="border border-gray-200 rounded-lg">
                          <SQLEditor
                            value={query}
                            onChange={setQuery}
                            height="300px"
                            className="w-full font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          color="blue"
                          className="flex items-center gap-2"
                          onClick={executeQuery}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Spinner className="h-4 w-4" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <PlayIcon className="h-4 w-4" />
                              Execute Query
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="blue"
                          className="flex items-center gap-2"
                          onClick={() => setIsSaveQueryDialogOpen(true)}
                          disabled={!query.trim()}
                        >
                          <BookmarkIcon className="h-4 w-4" />
                          Save Query
                        </Button>
                        
                        <Button
                          variant="text"
                          color="red"
                          className="flex items-center gap-2"
                          onClick={() => setQuery("")}
                          disabled={!query.trim()}
                        >
                          <TrashIcon className="h-4 w-4" />
                          Clear
                        </Button>
                      </div>
                      
                      {errorMsg && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <Typography variant="small" color="red" className="font-medium">
                            Error executing query:
                          </Typography>
                          <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-x-auto">
                            {errorMsg}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === "results" && (
                    <div className="p-4">
                      <div className="mb-4 flex justify-between items-center">
                        <Typography variant="h6" color="blue-gray" className="flex items-center gap-2">
                          <TableCellsIcon className="h-5 w-5 text-blue-500" />
                          Query Results
                        </Typography>
                        
                        {executionTime > 0 && (
                          <Chip
                            value={`${executionTime}ms`}
                            size="sm"
                            variant="outlined"
                            color="blue"
                            icon={<ClockIcon className="h-3 w-3" />}
                          />
                        )}
                      </div>
                      
                      {gridColumns.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  {gridColumns.map((column, index) => (
                                    <th 
                                      key={index}
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      {column.headerName}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {gridRows.map((row, rowIndex) => (
                                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    {gridColumns.map((column, colIndex) => (
                                      <td 
                                        key={colIndex}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                      >
                                        {row[column.field] !== null && row[column.field] !== undefined
                                          ? String(row[column.field])
                                          : <span className="text-gray-400">NULL</span>
                                        }
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {affectedRows > 0 && (
                            <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500 border-t border-gray-200">
                              {affectedRows} {affectedRows === 1 ? 'row' : 'rows'} affected
                            </div>
                          )}
                        </div>
                      ) : isLoading ? (
                        <div className="text-center p-12">
                          <Spinner className="h-8 w-8 mx-auto mb-4" />
                          <Typography variant="small" color="gray">
                            Executing query...
                          </Typography>
                        </div>
                      ) : (
                        <div className="text-center p-12 border border-gray-200 rounded-lg">
                          <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-blue-gray-200" />
                          <Typography variant="small" color="gray" className="mb-1">
                            No results to display
                          </Typography>
                          <Typography variant="small" color="gray">
                            Execute a query to see results here
                          </Typography>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === "stats" && (
                    <div className="p-4">
                      <div className="mb-6">
                        <Typography variant="h6" color="blue-gray" className="flex items-center gap-2 mb-4">
                          <ChartBarIcon className="h-5 w-5 text-blue-500" />
                          Query Statistics
                        </Typography>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Card className="bg-blue-50 shadow-none hover:shadow-sm transition-all duration-300">
                            <CardBody className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 rounded-full">
                                  <DocumentTextIcon className="h-5 w-5 text-blue-700" />
                                </div>
                                <div>
                                  <Typography variant="small" color="blue-gray" className="font-medium">
                                    Total Queries
                                  </Typography>
                                  <Typography variant="h6" color="blue">
                                    {queryStats.totalQueries}
                                  </Typography>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                          
                          <Card className="bg-green-50 shadow-none hover:shadow-sm transition-all duration-300">
                            <CardBody className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-100 rounded-full">
                                  <ClockIcon className="h-5 w-5 text-green-700" />
                                </div>
                                <div>
                                  <Typography variant="small" color="blue-gray" className="font-medium">
                                    Avg. Execution Time
                                  </Typography>
                                  <Typography variant="h6" color="green">
                                    {queryStats.avgExecutionTime.toFixed(2)}ms
                                  </Typography>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                          
                          <Card className="bg-indigo-50 shadow-none hover:shadow-sm transition-all duration-300">
                            <CardBody className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-100 rounded-full">
                                  <CheckCircleIcon className="h-5 w-5 text-indigo-700" />
                                </div>
                                <div>
                                  <Typography variant="small" color="blue-gray" className="font-medium">
                                    Success Rate
                                  </Typography>
                                  <Typography variant="h6" color="indigo">
                                    {queryStats.successRate}%
                                  </Typography>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                          
                          <Card className="bg-purple-50 shadow-none hover:shadow-sm transition-all duration-300">
                            <CardBody className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-100 rounded-full">
                                  <CalendarIcon className="h-5 w-5 text-purple-700" />
                                </div>
                                <div>
                                  <Typography variant="small" color="blue-gray" className="font-medium">
                                    Last Execution
                                  </Typography>
                                  <Typography variant="h6" color="purple">
                                    {queryStats.lastExecutionTime 
                                      ? new Date(queryStats.lastExecutionTime).toLocaleTimeString()
                                      : 'Never'
                                    }
                                  </Typography>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </div>
                      </div>
                      
                      <div>
                        <Typography variant="h6" color="blue-gray" className="flex items-center gap-2 mb-4">
                          <BookmarkIcon className="h-5 w-5 text-blue-500" />
                          Saved Queries
                        </Typography>
                        
                        {savedQueries.length > 0 ? (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <ul className="divide-y divide-gray-200">
                              {savedQueries.map((savedQuery, index) => (
                                <li key={index} className="hover:bg-gray-50 transition-colors">
                                  <div className="px-6 py-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <Typography variant="small" color="blue-gray" className="font-medium mb-1">
                                          {savedQuery.name}
                                        </Typography>
                                        {savedQuery.description && (
                                          <Typography variant="small" color="gray" className="mb-2">
                                            {savedQuery.description}
                                          </Typography>
                                        )}
                                        <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 max-w-xl overflow-x-auto">
                                          {savedQuery.query}
                                        </pre>
                                      </div>
                                      <Button
                                        variant="text"
                                        color="blue"
                                        size="sm"
                                        className="flex items-center gap-1"
                                        onClick={() => setQuery(savedQuery.query)}
                                      >
                                        <ArrowUturnLeftIcon className="h-3 w-3" />
                                        Load
                                      </Button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="text-center p-10 border border-gray-200 rounded-lg">
                            <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-blue-gray-200" />
                            <Typography variant="small" color="gray" className="mb-1">
                              No saved queries
                            </Typography>
                            <Typography variant="small" color="gray">
                              Save queries for quick access in the future
                            </Typography>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Save Query Dialog */}
      <Dialog open={isSaveQueryDialogOpen} handler={() => setIsSaveQueryDialogOpen(false)} className="bg-white rounded-lg">
        <DialogHeader className="flex items-center gap-2">
          <BookmarkIcon className="h-5 w-5 text-blue-500" />
          Save SQL Query
        </DialogHeader>
        <DialogBody>
          <div className="mb-4">
            <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
              Query Name *
            </Typography>
            <Input
              type="text"
              label="Enter a descriptive name for this query"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              className="!border-t-blue-gray-200 focus:!border-blue-500"
              required
            />
          </div>
          
          <div>
            <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
              Description
            </Typography>
            <Input
              type="text"
              label="Add a description to help identify this query later"
              value={queryDescription}
              onChange={(e) => setQueryDescription(e.target.value)}
              className="!border-t-blue-gray-200 focus:!border-blue-500"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setIsSaveQueryDialogOpen(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            color="blue"
            onClick={saveQuery}
            disabled={isSavingQuery || !queryName.trim()}
            loading={isSavingQuery}
          >
            {isSavingQuery ? 'Saving...' : 'Save Query'}
          </Button>
        </DialogFooter>
      </Dialog>
    </Authenticated>
  );
}

// Wrap the component with an error boundary
export default function SQLExplorer(props) {
  return (
    <ErrorBoundary>
      <SQLExplorerComponent {...props} />
    </ErrorBoundary>
  );
}
