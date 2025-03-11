import React, { useState, useEffect } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  Chip, 
  Card, 
  CardHeader, 
  CardBody, 
  Typography, 
  Button, 
  Spinner,
  Select,
  Option
} from '@material-tailwind/react';
import { 
  ArrowDownTrayIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

// Function to prettify JSON display
const formatJson = (value) => {
  if (!value) return '';
  try {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch (e) {
    return String(value);
  }
};

// Function to format cell values
const formatCellValue = (value, dataType) => {
  if (value === null || value === undefined) return '-';
  
  // Handle different data types
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    // Format date strings
    return new Date(value).toLocaleString();
  } else if (
    (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) ||
    (dataType && (dataType.includes('json') || dataType.includes('object')))
  ) {
    try {
      // Pretty-print JSON
      const jsonObj = typeof value === 'string' ? JSON.parse(value) : value;
      return (
        <div className="max-h-32 overflow-auto">
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(jsonObj, null, 2)}</pre>
        </div>
      );
    } catch (e) {
      return String(value);
    }
  } else if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  } else if (value.length > 100) {
    // Truncate long text
    return (
      <div className="truncate max-w-xs" title={value}>
        {value.substring(0, 100)}...
      </div>
    );
  }
  
  return value;
};

// Function to export data to CSV
const exportToCsv = (data, columns, filename = 'query_results') => {
  if (!data || !data.length) return;
  
  // Extract headers from columns
  const headers = columns.map(col => col.headerName || col.field);
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(row => columns.map(col => {
      const value = row[col.field];
      // Handle values with commas or quotes
      if (value === null || value === undefined) return '';
      const formatted = String(value).replace(/"/g, '""');
      return `"${formatted}"`;
    }).join(','))
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0057B8',
    },
    secondary: {
      main: '#00AEEF',
    },
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus': {
            outline: 'none',
          },
        },
        columnHeader: {
          backgroundColor: '#f8fafc',
          color: '#334155',
          fontWeight: 600,
        },
      },
    },
  },
});

const QueryResultsTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  rowCount = 0,
  executionTime = 0, // in milliseconds
  affectedRows = 0,
  pageSize = 25,
  onExport,
  emptyMessage = 'No results to display',
}) => {
  const [rows, setRows] = useState([]);
  const [processedColumns, setProcessedColumns] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: pageSize,
    page: 0,
  });
  const [displayMode, setDisplayMode] = useState('table');

  useEffect(() => {
    // Process rows to ensure each has a unique id
    if (data && data.length > 0) {
      const rowsWithIds = data.map((row, index) => ({
        id: row.id || `row-${index}`,
        ...row,
      }));
      setRows(rowsWithIds);
    } else {
      setRows([]);
    }
    
    // Process columns to add formatters
    if (columns && columns.length > 0) {
      const enhancedColumns = columns.map(col => ({
        ...col,
        renderCell: (params) => formatCellValue(params.value, col.type),
        flex: 1,
        minWidth: 150,
      }));
      setProcessedColumns(enhancedColumns);
    } else {
      setProcessedColumns([]);
    }
  }, [data, columns]);

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      exportToCsv(rows, processedColumns);
    }
  };

  // Render the grid
  return (
    <Card className="w-full shadow-sm">
      <CardHeader 
        floated={false} 
        shadow={false} 
        className="rounded-none p-4 border-b border-blue-gray-50"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Typography variant="h6" color="blue-gray" className="flex items-center">
              <TableCellsIcon className="h-5 w-5 mr-2 text-blue-500" />
              Query Results
            </Typography>
            {executionTime > 0 && (
              <Chip
                value={`${(executionTime / 1000).toFixed(2)}s`}
                size="sm"
                variant="ghost"
                color="blue"
                icon={<ClockIcon className="h-3 w-3" />}
                className="ml-2"
              />
            )}
            {affectedRows > 0 && (
              <Chip
                value={`${affectedRows} row${affectedRows !== 1 ? 's' : ''} affected`}
                size="sm"
                variant="ghost"
                color="green"
                className="ml-2"
              />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex border border-blue-gray-100 rounded">
              <Button
                size="sm"
                variant={displayMode === 'table' ? 'filled' : 'text'}
                color={displayMode === 'table' ? 'blue' : 'blue-gray'}
                className="rounded-r-none px-3"
                onClick={() => setDisplayMode('table')}
              >
                <TableCellsIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={displayMode === 'json' ? 'filled' : 'text'}
                color={displayMode === 'json' ? 'blue' : 'blue-gray'}
                className="rounded-l-none px-3"
                onClick={() => setDisplayMode('json')}
              >
                <DocumentTextIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              size="sm"
              color="blue"
              variant="outlined"
              className="flex items-center gap-2"
              onClick={handleExport}
              disabled={rows.length === 0 || loading}
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Spinner className="h-8 w-8 text-blue-500" />
            <span className="ml-2 text-blue-gray-600">Executing query...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-100 mb-4 text-left">
              <Typography variant="small" className="font-medium">Error executing query:</Typography>
              <pre className="mt-1 text-xs whitespace-pre-wrap">{error}</pre>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-blue-gray-400">
            <DocumentTextIcon className="h-12 w-12 mb-4 text-blue-gray-200" />
            <Typography variant="h6" color="blue-gray">
              {emptyMessage}
            </Typography>
            <Typography variant="small" className="text-center mt-1">
              Execute a query to see results here
            </Typography>
          </div>
        ) : displayMode === 'json' ? (
          <div className="p-4">
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-[60vh]">
              {JSON.stringify(rows, null, 2)}
            </pre>
          </div>
        ) : (
          <div style={{ height: rows.length > 10 ? '60vh' : 'auto', minHeight: '250px', width: '100%' }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                rows={rows}
                columns={processedColumns}
                loading={loading}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50, 100]}
                density="standard"
                disableRowSelectionOnClick
                components={{
                  Toolbar: GridToolbar,
                }}
                componentsProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: { debounceMs: 500 },
                  },
                }}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize },
                  },
                }}
                sx={{
                  '& .MuiDataGrid-virtualScroller': {
                    overflowX: 'auto',
                  },
                  '& .MuiDataGrid-cell': {
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                  },
                }}
              />
            </ThemeProvider>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default QueryResultsTable; 