import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  DataGrid, 
  GridToolbar, 
  GridActionsCellItem,
  useGridApiRef 
} from '@mui/x-data-grid';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Typography, Chip, Button } from '@material-tailwind/react';
import { debounce } from 'lodash';
import LoadingIndicator from '@/Components/LoadingIndicator';
import { useTheme } from '@/Context/ThemeContext';

// Create a modern theme for the grid
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0057B8',
      light: '#3385d6',
      dark: '#003d8f',
    },
    secondary: {
      main: '#00AEEF',
      light: '#36c9f7',
      dark: '#0085b3',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#6b7280',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          backgroundColor: '#ffffff',
          color: '#333333',
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#f0f9ff',
          },
          '& .MuiDataGrid-row': {
            transition: 'background-color 0.2s ease',
            cursor: 'pointer',
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
            backgroundColor: '#bbbbbb',
            borderRadius: '6px',
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
            backgroundColor: '#f5f5f5',
          },
        },
        columnHeader: {
          backgroundColor: '#f8fafc',
          color: '#334155',
          fontWeight: 600,
          fontSize: '0.875rem',
        },
        cell: {
          fontSize: '0.875rem',
          padding: '8px 16px',
          color: '#333333',
        },
        toolbar: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '8px 16px',
        },
        footerContainer: {
          borderTop: '1px solid #e2e8f0',
        },
      },
    },
  },
});

// Dark theme variant
const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    ...lightTheme.palette,
    mode: 'dark',
    background: {
      default: '#111827',
      paper: '#111827',
    },
    text: {
      primary: '#e5e7eb',
      secondary: '#9ca3af',
    },
    divider: '#374151',
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          ...lightTheme.components.MuiDataGrid.styleOverrides.root,
          backgroundColor: '#111827',
          color: '#e5e7eb',
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#1f2937',
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
            backgroundColor: '#4B5563',
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
            backgroundColor: '#1F2937',
          },
        },
        columnHeaders: {
          backgroundColor: '#1F2937',
          borderBottom: '1px solid #374151',
        },
        columnHeader: {
          backgroundColor: '#1F2937',
          color: '#E5E7EB',
          fontWeight: 600,
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: '#374151',
          },
        },
        columnHeaderTitle: {
          color: '#E5E7EB',
          fontWeight: 600,
          fontSize: '0.875rem',
        },
        cell: {
          ...lightTheme.components.MuiDataGrid.styleOverrides.cell,
          color: '#E5E7EB',
          borderBottom: '1px solid #374151',
        },
        toolbar: {
          ...lightTheme.components.MuiDataGrid.styleOverrides.toolbar,
          backgroundColor: '#111827',
          borderBottom: '1px solid #374151',
          '& .MuiButton-root': {
            color: '#E5E7EB',
            '&:hover': {
              backgroundColor: '#374151',
            },
          },
          '& .MuiIconButton-root': {
            color: '#E5E7EB',
            '&:hover': {
              backgroundColor: '#374151',
            },
          },
        },
        footerContainer: {
          ...lightTheme.components.MuiDataGrid.styleOverrides.footerContainer,
          borderTop: '1px solid #374151',
          backgroundColor: '#1F2937',
          color: '#E5E7EB',
          '& .MuiTablePagination-root': {
            color: '#E5E7EB',
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            color: '#E5E7EB',
          },
        },
        menu: {
          backgroundColor: '#1F2937',
          color: '#E5E7EB',
          '& .MuiMenuItem-root': {
            color: '#E5E7EB',
            '&:hover': {
              backgroundColor: '#374151',
            },
          },
        },
        filterPanel: {
          backgroundColor: '#1F2937',
          color: '#E5E7EB',
          '& .MuiTextField-root': {
            '& .MuiInputBase-root': {
              color: '#E5E7EB',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#374151',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4B5563',
            },
          },
        },
        overlay: {
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
        },
      },
    },
  },
});

// Status renderer with colored chips
const StatusCell = ({ value }) => {
  const getStatusColor = (status) => {
    status = status?.toString()?.toLowerCase() || '';
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

  return (
    <Chip
      size="sm"
      variant="ghost"
      color={getStatusColor(value)}
      value={value || 'N/A'}
      className="capitalize transition-all duration-200 hover:scale-105"
    />
  );
};

// Date renderer
const DateCell = ({ value }) => {
  if (!value) return <span className="text-gray-500">Not set</span>;
  
  try {
    const date = new Date(value);
    return <span>{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
  } catch (e) {
    return <span>{value}</span>;
  }
};

// Number renderer
const NumberCell = ({ value }) => {
  if (value === null || value === undefined) return <span className="text-gray-500">-</span>;
  
  return <span className="font-medium">{Number(value).toLocaleString()}</span>;
};

// Text renderer with truncation for long text
const TextCell = ({ value }) => {
  if (!value) return <span className="text-gray-500">-</span>;
  
  const text = value.toString();
  const shouldTruncate = text.length > 50;
  
  return (
    <div className="max-w-xs truncate hover:whitespace-normal hover:overflow-visible hover:z-10 transition-all duration-200" title={shouldTruncate ? text : ''}>
      {shouldTruncate ? `${text.substring(0, 50)}...` : text}
    </div>
  );
};

// Main DataGrid component
const DataGridComponent = ({
  rows = [],
  columns = [],
  loading = false,
  rowCount = 0,
  onRowClick = null,
  onCellEditCommit = null,
  onPageChange = null,
  onPageSizeChange = null,
  initialState = {},
  checkboxSelection = false,
  disableSelectionOnClick = true,
  autoHeight = true,
  headerHeight = 56,
  rowHeight = 52,
  pageSize = 25,
  page = 0,
  pagination = true,
  disableColumnMenu = false,
  disableColumnFilter = false,
  hideFooter = false,
  hideFooterPagination = false,
  paginationMode = "server",
  className = "",
  getRowClassName = () => "",
  getRowId = (row) => row.id,
  onSelectionModelChange = null,
  selectionModel = [],
  density = "standard",
  columnVisibilityModel = {},
  onColumnVisibilityModelChange = null,
  onMouseEnter = null,
  onMouseLeave = null,
}) => {
  const apiRef = useGridApiRef();
  const [containerHeight, setContainerHeight] = useState(400);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hoverRowId, setHoverRowId] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { darkMode } = useTheme();

  // Safe data preparation - filter out invalid rows and sanitize data
  const safeRows = useMemo(() => {
    try {
      if (!rows || !Array.isArray(rows)) {
        console.warn("DataGrid received invalid rows data:", rows);
        return [];
      }
      
      const validRows = [];
      
      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip null or undefined rows
        if (row === null || row === undefined) {
          console.warn("DataGrid received null/undefined row at index", i);
          continue;
        }
        
        try {
          // Ensure row has a valid ID
          let rowId;
          try {
            rowId = getRowId(row);
          } catch (idErr) {
            console.warn("Error getting row ID:", idErr);
            // Fallback to index-based ID if getRowId fails
            rowId = `row-${i}`;
          }
          
          if (rowId === undefined || rowId === null) {
            // Assign a fallback ID
            rowId = `row-${i}`;
          }
          
          // Clone the row to avoid mutating the original
          const safeRow = { ...row };
          
          // Ensure the ID is set on the row object
          if (typeof getRowId === 'function' && getRowId.toString().includes('row.id')) {
            safeRow.id = rowId;
          }
          
          // Sanitize all cell values
          if (columns && Array.isArray(columns)) {
            columns.forEach(col => {
              if (!col || !col.field) return;
              
              // Handle null/undefined values based on column type
              if (safeRow[col.field] === null || safeRow[col.field] === undefined) {
                if (col.type === 'number') {
                  safeRow[col.field] = 0;
                } else if (col.type === 'date') {
                  safeRow[col.field] = null; // Date components handle null safely
                } else if (col.type === 'boolean') {
                  safeRow[col.field] = false;
                } else {
                  safeRow[col.field] = '';
                }
              }
            });
          }
          
          // Add the sanitized row to our result array
          validRows.push(safeRow);
        } catch (err) {
          console.error("Error processing row:", err, row);
          // Continue with next row instead of skipping this one entirely
        }
      }
      
      return validRows;
    } catch (err) {
      console.error("Error preparing DataGrid rows:", err);
      setHasError(true);
      setErrorMessage("Error preparing grid data: " + err.message);
      return [];
    }
  }, [rows, columns, getRowId]);

  // Safe column preparation - ensure renderCell methods handle null values
  const safeColumns = useMemo(() => {
    try {
      if (!columns || !Array.isArray(columns)) return [];
      
      return columns.map(column => {
        const originalRenderCell = column.renderCell;
        
        // Create safe renderCell wrapper that handles null/undefined values
        const safeRenderCell = (params) => {
          try {
            // Handle null params case
            if (!params) return <span>—</span>;
            
            // Handle null value case
            if (params.value === null || params.value === undefined) {
              // If the column has a type, return appropriate default
              switch (column.type) {
                case 'number':
                  return <span className="text-gray-400">0</span>;
                case 'date':
                  return <span className="text-gray-400">—</span>;
                case 'boolean':
                  return <span className="text-gray-400">—</span>;
                default:
                  return <span className="text-gray-400">—</span>;
              }
            }
            
            // If there's a custom renderCell, use it with a try/catch
            if (originalRenderCell) {
              try {
                return originalRenderCell(params);
              } catch (err) {
                console.error(`Error in renderCell for column ${column.field}:`, err);
                return <span className="text-red-400" title={err.message}>Error</span>;
              }
            }
            
            // Default rendering with string conversion for safety
            return <span>{String(params.value)}</span>;
          } catch (err) {
            console.error(`Error in safe renderCell for column ${column.field}:`, err);
            return <span className="text-red-400">Error</span>;
          }
        };
        
        // Create a new column with safe renderCell
        return {
          ...column,
          renderCell: safeRenderCell,
        };
      });
    } catch (err) {
      console.error("Error preparing DataGrid columns:", err);
      setHasError(true);
      setErrorMessage("Error preparing grid columns: " + err.message);
      return [];
    }
  }, [columns]);

  // Calculate proper height based on number of rows and row height
  useEffect(() => {
    if (autoHeight && safeRows.length > 0) {
      // Calculate height based on rows plus header and footer
      const calculatedHeight = Math.min(
        (safeRows.length * rowHeight) + headerHeight + (hideFooter ? 0 : 52),
        // Max height to prevent overly large grids
        800
      );
      
      // Ensure minimum height for empty or small datasets
      const newHeight = Math.max(calculatedHeight, 400);
      setContainerHeight(newHeight);
    }
  }, [safeRows, rowHeight, headerHeight, hideFooter, autoHeight]);

  // Handle resize window events
  useEffect(() => {
    const handleResize = debounce(() => {
      if (apiRef.current) {
        apiRef.current.resize();
      }
      setIsMobile(window.innerWidth < 768);
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, [apiRef]);

  // Optimize columns for mobile
  const responsiveColumns = React.useMemo(() => {
    if (!isMobile) return safeColumns;
    
    // On mobile, prioritize important columns and reduce width
    return safeColumns.map(column => ({
      ...column,
      width: column.width ? Math.min(column.width, 150) : 150,
      flex: column.flex ? Math.min(column.flex, 1) : undefined
    }));
  }, [safeColumns, isMobile]);

  // Handle row hover events
  const handleRowMouseEnter = (params) => {
    setHoverRowId(params.id);
    if (onMouseEnter) onMouseEnter(params);
  };

  const handleRowMouseLeave = (params) => {
    setHoverRowId(null);
    if (onMouseLeave) onMouseLeave(params);
  };

  // Handle errors during rendering
  const handleError = (error) => {
    console.error("DataGrid error:", error);
    setHasError(true);
    setErrorMessage(error.message || "Unknown error in DataGrid");
  };

  // Error display component
  const ErrorDisplay = () => (
    <div className="w-full flex justify-center items-center p-8 bg-red-50 rounded-lg border border-red-200">
      <div className="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <Typography className="text-lg font-medium text-red-700 mb-2">DataGrid Error</Typography>
        <Typography className="text-sm text-red-600 max-w-md">
          {errorMessage || "An error occurred while rendering the data grid. Please try refreshing the page."}
        </Typography>
        <Button color="red" variant="outlined" className="mt-4" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    </div>
  );

  return (
    <div 
      className={`w-full ${className} relative rounded-lg overflow-hidden`} 
      style={{ 
        height: autoHeight ? 'auto' : containerHeight,
        minWidth: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {hasError ? (
        <ErrorDisplay />
      ) : (
        <React.Fragment>
          <MuiThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <DataGrid
              apiRef={apiRef}
              rows={safeRows}
              columns={responsiveColumns}
              loading={loading}
              checkboxSelection={checkboxSelection}
              disableSelectionOnClick={disableSelectionOnClick}
              onCellEditCommit={onCellEditCommit}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              pageSize={pageSize}
              page={page}
              rowCount={rowCount || safeRows.length}
              autoHeight={autoHeight}
              headerHeight={headerHeight}
              rowHeight={rowHeight}
              pagination={pagination}
              paginationMode={paginationMode}
              hideFooter={hideFooter}
              hideFooterPagination={hideFooterPagination}
              disableColumnMenu={disableColumnMenu}
              disableColumnFilter={disableColumnFilter}
              initialState={initialState}
              getRowClassName={(params) => {
                try {
                  const baseClass = getRowClassName(params);
                  const hoverClass = hoverRowId === params.id ? 'bg-blue-50' : '';
                  return `${baseClass} ${hoverClass}`;
                } catch (error) {
                  console.error("Error getting row class:", error);
                  return '';
                }
              }}
              getRowId={(row) => {
                try {
                  return getRowId(row);
                } catch (error) {
                  console.error("Error getting row ID:", error);
                  return Math.random().toString(36).substr(2, 9); // Fallback random ID
                }
              }}
              onSelectionModelChange={onSelectionModelChange}
              selectionModel={selectionModel}
              onRowClick={onRowClick}
              density={density}
              components={{
                Toolbar: GridToolbar,
                NoRowsOverlay: CustomNoRowsOverlay,
                NoResultsOverlay: CustomNoRowsOverlay,
                LoadingOverlay: CustomLoadingOverlay,
                ErrorOverlay: ErrorDisplay,
              }}
              componentsProps={{
                row: {
                  onMouseEnter: handleRowMouseEnter,
                  onMouseLeave: handleRowMouseLeave,
                },
              }}
              error={hasError}
              onError={handleError}
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: darkMode ? '1px solid #374151' : '1px solid #f0f0f0',
                },
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: darkMode ? '1px solid #374151' : '2px solid #e0e0e0',
                  backgroundColor: darkMode ? '#1F2937' : '#f8fafc',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 'bold',
                  color: darkMode ? '#E5E7EB' : '#334155',
                },
                '& .MuiDataGrid-virtualScroller': {
                  overflowX: 'auto',
                  overflowY: 'auto',
                },
                '& .MuiDataGrid-row--error': {
                  backgroundColor: darkMode ? '#2D1A1A' : '#FEF2F2',
                  '&:hover': {
                    backgroundColor: darkMode ? '#3D2A2A' : '#FEE2E2',
                  },
                },
              }}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={onColumnVisibilityModelChange}
            />
          </MuiThemeProvider>
        </React.Fragment>
      )}
    </div>
  );
};

// Custom loading overlay component
const CustomLoadingOverlay = () => {
  return (
    <div className="flex justify-center items-center h-full w-full absolute top-0 left-0 bg-white bg-opacity-60 z-10">
      <LoadingIndicator size="lg" color="blue" text="Loading data..." />
    </div>
  );
};

// Custom empty state overlay
const CustomNoRowsOverlay = () => {
  return (
    <div className="flex justify-center items-center h-full py-12">
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <Typography variant="paragraph" color="blue-gray" className="opacity-70 mb-2">
          No data available
        </Typography>
        <Typography variant="small" color="blue-gray" className="opacity-50">
          Try adjusting your search criteria or add new records
        </Typography>
      </div>
    </div>
  );
};

export default DataGridComponent; 