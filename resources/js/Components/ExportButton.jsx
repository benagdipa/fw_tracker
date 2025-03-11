import React, { useState } from "react";
import { Button, Menu, MenuHandler, MenuList, MenuItem, Spinner } from "@material-tailwind/react";
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableViewIcon from '@mui/icons-material/TableView';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import toast from "react-hot-toast";

/**
 * Enhanced ExportButton component with improved styling and functionality
 * 
 * @param {string} title - Button text
 * @param {string} filename - Name of the exported file (without extension)
 * @param {Array} data - Data array to export (for client-side export)
 * @param {string} url - URL for server-side export
 * @param {string} size - Button size (xs, sm, md, lg, xl)
 * @param {string} variant - Button variant (filled, outlined, text, gradient)
 * @param {string} className - Additional CSS classes
 * @param {Array} columns - Column configuration for export mapping
 * @param {string} format - Export format (csv, xlsx, json)
 */
export default function ExportButton({ 
  onExport,
  loading = false,
  formats = ['xlsx', 'csv', 'pdf'],
  color = "blue",
  size = "sm",
  className = "",
  label = "Export"
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format) => {
    try {
      setIsOpen(false);
      await onExport(format);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const getFormatIcon = (format) => {
    switch (format.toLowerCase()) {
      case 'xlsx':
        return <TableViewIcon className="h-4 w-4" />;
      case 'csv':
        return <FileDownloadIcon className="h-4 w-4" />;
      case 'pdf':
        return <PictureAsPdfIcon className="h-4 w-4" />;
      default:
        return <DownloadIcon className="h-4 w-4" />;
    }
  };

  const getFormatLabel = (format) => {
    switch (format.toLowerCase()) {
      case 'xlsx':
        return 'Excel (.xlsx)';
      case 'csv':
        return 'CSV File (.csv)';
      case 'pdf':
        return 'PDF Document (.pdf)';
      default:
        return format.toUpperCase();
    }
  };

  return (
    <Menu open={isOpen} handler={setIsOpen} placement="bottom-end">
      <MenuHandler>
        <Button
          color={color}
          size={size}
          className={`flex items-center gap-2 ${className}`}
          disabled={loading}
        >
          {loading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <DownloadIcon className="h-4 w-4" />
          )}
          {label}
        </Button>
      </MenuHandler>
      <MenuList>
        {formats.map((format) => (
          <MenuItem
            key={format}
            onClick={() => handleExport(format)}
            className="flex items-center gap-2"
          >
            {getFormatIcon(format)}
            <span>{getFormatLabel(format)}</span>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
