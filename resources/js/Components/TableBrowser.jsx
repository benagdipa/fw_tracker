import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
  Tooltip,
  Spinner
} from '@material-tailwind/react';
import { 
  MagnifyingGlassIcon, 
  PlayIcon, 
  ChevronRightIcon,
  ChevronDownIcon,
  TableCellsIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const TableBrowser = ({
  tables = [],
  columns = {},
  loading = false,
  selectedTable = null,
  onTableSelect,
  onTableExecute,
  onLoadMore,
  hasMoreTables = false,
  loadingMore = false,
  searchTerm = '',
  onSearchChange,
  className = '',
}) => {
  const [expandedTable, setExpandedTable] = useState(null);

  const handleTableClick = (tableName) => {
    if (onTableSelect) {
      onTableSelect(tableName);
    }
    
    // Toggle expansion
    if (expandedTable === tableName) {
      setExpandedTable(null);
    } else {
      setExpandedTable(tableName);
    }
  };

  return (
    <Card className={`w-full shadow-sm ${className}`}>
      <CardBody className="p-4">
        {/* Search input */}
        <div className="relative mb-4">
          <Input
            type="text"
            label="Search tables"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10"
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
          />
        </div>
        
        {/* Table count */}
        <div className="flex justify-between items-center mb-3">
          <Typography variant="small" color="blue-gray" className="font-medium">
            Tables ({tables.length})
          </Typography>
          {tables.length > 0 && (
            <Tooltip content="Click on a table to view its columns">
              <InformationCircleIcon className="h-4 w-4 text-blue-gray-400" />
            </Tooltip>
          )}
        </div>
        
        {/* Tables list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-8 w-8 text-blue-500" />
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-8 text-blue-gray-400">
            <TableCellsIcon className="h-10 w-10 mx-auto mb-2" />
            <Typography variant="small">
              {searchTerm ? 'No tables match your search' : 'No tables available'}
            </Typography>
          </div>
        ) : (
          <div className="max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
            <div className="space-y-1">
              {tables.map((tableName, index) => (
                <div key={index} className="mb-1">
                  <div
                    className={`
                      flex items-center justify-between
                      py-2 px-3 rounded-md cursor-pointer
                      ${selectedTable === tableName ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}
                    `}
                    onClick={() => handleTableClick(tableName)}
                  >
                    <div className="flex items-center truncate mr-2">
                      {columns && columns[tableName] ? (
                        expandedTable === tableName ? (
                          <ChevronDownIcon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                        )
                      ) : (
                        <TableCellsIcon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                      )}
                      <span className="text-sm truncate flex-1">{tableName}</span>
                    </div>
                    <Tooltip content="Run SELECT query">
                      <IconButton
                        size="sm"
                        variant="text"
                        color="blue"
                        className="p-1 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTableExecute) {
                            onTableExecute(tableName);
                          }
                        }}
                      >
                        <PlayIcon className="h-3.5 w-3.5" />
                      </IconButton>
                    </Tooltip>
                  </div>
                  
                  {/* Columns list */}
                  {expandedTable === tableName && columns && columns[tableName] && (
                    <div className="ml-5 mt-1 mb-2 border-l-2 border-gray-200 pl-2">
                      {columns[tableName].map((column, colIndex) => (
                        <div 
                          key={colIndex} 
                          className="flex items-center py-1 px-2 text-xs hover:bg-gray-50 rounded"
                        >
                          <span className="font-medium text-blue-gray-800 truncate">
                            {column.column_name || column[0]}
                          </span>
                          <span className="ml-2 text-blue-gray-500 truncate">
                            {column.data_type || column[1]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Load more button */}
            {(hasMoreTables || loadingMore) && (
              <div className="text-center mt-2">
                {loadingMore ? (
                  <Spinner className="h-5 w-5 mx-auto text-blue-500" />
                ) : (
                  <Button
                    size="sm"
                    variant="text"
                    color="blue"
                    className="text-xs normal-case"
                    onClick={onLoadMore}
                  >
                    Load More Tables
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TableBrowser; 