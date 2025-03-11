import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Card, Button, Typography, Tabs, Tab, TabsHeader, TabsBody, TabPanel, Tooltip } from "@material-tailwind/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Timeline from "@/Components/Timeline";
import toast from "react-hot-toast";
import ErrorBoundary from '@/Components/ErrorBoundary';
import ExportButton from '@/Components/ExportButton';
import axios from 'axios';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import MapIcon from '@mui/icons-material/Map';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';

export default function Show({ auth, wntd, timeline, historyByField, fieldLabels }) {
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Group fields by category for organized display
  const fieldGroups = {
    basic: ["site_name", "loc_id", "wntd"],
    technical: ["imsi", "version", "avc", "bw_profile", "home_cell", "home_pci", "traffic_profile"],
    location: ["lon", "lat"],
    tracking: ["remarks", "start_date", "end_date", "solution_type", "status"]
  };

  // Format field value based on type
  const formatFieldValue = (field, value) => {
    if (value === null || value === undefined) return "-";
    
    if (field === "start_date" || field === "end_date") {
      return formatDate(value);
    }
    
    if (field === "artefacts" && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
              {item}
            </span>
          ))}
        </div>
      );
    }

    if (field === "status") {
      let color = "bg-gray-100 text-gray-800";
      if (String(value).toLowerCase().includes("complete") || String(value).toLowerCase().includes("active")) {
        color = "bg-green-100 text-green-800";
      } else if (String(value).toLowerCase().includes("pending") || String(value).toLowerCase().includes("progress")) {
        color = "bg-blue-100 text-blue-800";
      } else if (String(value).toLowerCase().includes("error") || String(value).toLowerCase().includes("fail")) {
        color = "bg-red-100 text-red-800";
      } else if (String(value).toLowerCase().includes("warning") || String(value).toLowerCase().includes("attention")) {
        color = "bg-amber-100 text-amber-800";
      }
      
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
          {value}
        </span>
      );
    }
    
    return value.toString();
  };

  // Handle delete button click
  const handleDelete = () => {
    if (confirmDelete) {
      try {
        router.delete(route('wntd.field.name.delete', { id: wntd.id }), {
          onSuccess: () => {
            toast.success("WNTD record deleted successfully");
          },
          onError: (errors) => {
            console.error("Delete error:", errors);
            toast.error("Failed to delete WNTD record");
          }
        });
      } catch (error) {
        console.error("Route error:", error);
        toast.error("Delete functionality is not available");
      }
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000); // Reset after 3 seconds
    }
  };

  // Print the details page
  const handlePrint = () => {
    window.print();
  };

  // Share the page URL
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `WNTD Details: ${wntd.loc_id}`,
        text: `Details for WNTD: ${wntd.wntd} at ${wntd.site_name}`,
        url: window.location.href,
      })
      .then(() => toast.success("Shared successfully"))
      .catch(() => toast.error("Sharing failed"));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success("URL copied to clipboard"))
        .catch(() => toast.error("Failed to copy URL"));
    }
  };

  const getFieldIcon = (field) => {
    const iconMap = {
      site_name: <SignalCellularAltIcon className="h-4 w-4 text-blue-500" />,
      wntd: <SettingsInputAntennaIcon className="h-4 w-4 text-green-500" />,
      status: <SignalCellularAltIcon className="h-4 w-4 text-purple-500" />,
      start_date: <CalendarTodayIcon className="h-4 w-4 text-amber-500" />,
      end_date: <CalendarTodayIcon className="h-4 w-4 text-red-500" />
    };
    
    return iconMap[field] || null;
  };

  const handleExport = async (format) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/wntd/export?format=${format}`, {
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format.toLowerCase();
      link.setAttribute('download', `wntd_${wntd.wntd}_${new Date().toISOString().split('T')[0]}.${extension}`);
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

  return (
    <Authenticated
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            WNTD Details: {wntd.loc_id} - {wntd.wntd}
          </h2>
          <div className="flex gap-2">
            <Link href={route("wntd.field.name.index")}>
              <Button size="sm" variant="outlined" className="flex items-center gap-1">
                <ArrowBackIcon fontSize="small" /> Back to List
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="outlined" 
              color="amber"
              className="flex items-center gap-1 print:hidden"
              onClick={handlePrint}
            >
              <PrintIcon fontSize="small" /> Print
            </Button>
            <Button 
              size="sm" 
              variant="outlined" 
              color="blue"
              className="flex items-center gap-1 print:hidden"
              onClick={handleShare}
            >
              <ShareIcon fontSize="small" /> Share
            </Button>
          </div>
        </div>
      }
    >
      <Head title={`WNTD Details: ${wntd.loc_id}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <ErrorBoundary>
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:hidden">
              <Card className="bg-blue-50 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Typography variant="small" className="text-gray-600">Site Name</Typography>
                    <Typography variant="h5" className="text-blue-500">{wntd.site_name || "-"}</Typography>
                  </div>
                  <div className="bg-blue-500 rounded-full p-2 text-white">
                    <SignalCellularAltIcon />
                  </div>
                </div>
              </Card>
              
              <Card className="bg-green-50 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Typography variant="small" className="text-gray-600">WNTD</Typography>
                    <Typography variant="h5" className="text-green-500">{wntd.wntd || "-"}</Typography>
                  </div>
                  <div className="bg-green-500 rounded-full p-2 text-white">
                    <SettingsInputAntennaIcon />
                  </div>
                </div>
              </Card>
              
              <Card className="bg-purple-50 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Typography variant="small" className="text-gray-600">Status</Typography>
                    <div className="mt-1">{formatFieldValue("status", wntd.status)}</div>
                  </div>
                  <div className="bg-purple-500 rounded-full p-2 text-white">
                    <SignalCellularAltIcon />
                  </div>
                </div>
              </Card>
              
              <Card className="bg-amber-50 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Typography variant="small" className="text-gray-600">Last Updated</Typography>
                    <Typography variant="h5" className="text-amber-500">
                      {formatDate(wntd.updated_at)}
                    </Typography>
                  </div>
                  <div className="bg-amber-500 rounded-full p-2 text-white">
                    <CalendarTodayIcon />
                  </div>
                </div>
              </Card>
            </div>

            <Card className="overflow-hidden print:shadow-none">
              <div className="bg-white p-6">
                <Tabs value={activeTab} onChange={(value) => setActiveTab(value)}>
                  <TabsHeader className="print:hidden">
                    <Tab value="details">
                      <div className="flex items-center gap-2">
                        <EditIcon fontSize="small" />
                        <span>Details</span>
                      </div>
                    </Tab>
                    <Tab value="history" className="print:hidden">
                      <div className="flex items-center gap-2">
                        <HistoryIcon fontSize="small" />
                        <span>History</span>
                      </div>
                    </Tab>
                    {wntd.lon && wntd.lat && (
                      <Tab value="map" className="print:hidden">
                        <div className="flex items-center gap-2">
                          <MapIcon fontSize="small" />
                          <span>Map</span>
                        </div>
                      </Tab>
                    )}
                  </TabsHeader>
                  <TabsBody>
                    <TabPanel value="details">
                      <div className="flex justify-between mb-4 print:hidden">
                        <Typography variant="h5" color="blue-gray">
                          WNTD Details
                        </Typography>
                        <div className="flex gap-2">
                          {/* Using try-catch to handle potential route errors */}
                          {(() => {
                            try {
                              const editUrl = route("wntd.field.name.edit", { id: wntd.id });
                              return (
                                <Link href={editUrl}>
                                  <Button 
                                    size="sm" 
                                    color="blue" 
                                    variant="outlined"
                                    className="flex items-center gap-1"
                                  >
                                    <EditIcon fontSize="small" /> Edit
                                  </Button>
                                </Link>
                              );
                            } catch (error) {
                              // If route doesn't exist, show a disabled button
                              console.error("Edit route error:", error);
                              return (
                                <Button 
                                  size="sm" 
                                  color="blue" 
                                  variant="outlined"
                                  className="flex items-center gap-1"
                                  disabled
                                  onClick={() => toast.error("Edit functionality is not available")}
                                >
                                  <EditIcon fontSize="small" /> Edit
                                </Button>
                              );
                            }
                          })()}
                          <Button 
                            size="sm" 
                            color="red" 
                            variant={confirmDelete ? "filled" : "outlined"}
                            className="flex items-center gap-1"
                            onClick={handleDelete}
                          >
                            <DeleteIcon fontSize="small" /> 
                            {confirmDelete ? "Confirm Delete" : "Delete"}
                          </Button>
                          <div className="flex items-center gap-2">
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

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Basic Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Typography variant="h6" color="blue-gray" className="mb-4 border-b pb-2">
                            Basic Information
                          </Typography>
                          <div className="space-y-3">
                            {fieldGroups.basic.map((field) => (
                              <div key={field} className="grid grid-cols-2 items-center">
                                <div className="flex items-center gap-2">
                                  {getFieldIcon(field)}
                                  <Typography variant="small" color="blue-gray" className="font-medium">
                                    {fieldLabels[field]}:
                                  </Typography>
                                </div>
                                <Typography variant="small">{formatFieldValue(field, wntd[field])}</Typography>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Technical Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Typography variant="h6" color="blue-gray" className="mb-4 border-b pb-2">
                            Technical Information
                          </Typography>
                          <div className="space-y-3">
                            {fieldGroups.technical.map((field) => (
                              <div key={field} className="grid grid-cols-2 items-center">
                                <div className="flex items-center gap-2">
                                  {getFieldIcon(field)}
                                  <Typography variant="small" color="blue-gray" className="font-medium">
                                    {fieldLabels[field]}:
                                  </Typography>
                                </div>
                                <Typography variant="small">{formatFieldValue(field, wntd[field])}</Typography>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Typography variant="h6" color="blue-gray" className="mb-4 border-b pb-2">
                            Location
                          </Typography>
                          <div className="space-y-3">
                            {fieldGroups.location.map((field) => (
                              <div key={field} className="grid grid-cols-2 items-center">
                                <div className="flex items-center gap-2">
                                  {getFieldIcon(field)}
                                  <Typography variant="small" color="blue-gray" className="font-medium">
                                    {fieldLabels[field]}:
                                  </Typography>
                                </div>
                                <Typography variant="small">{formatFieldValue(field, wntd[field])}</Typography>
                              </div>
                            ))}
                            
                            {wntd.lon && wntd.lat && (
                              <div className="mt-4 print:hidden">
                                <Button 
                                  size="sm" 
                                  color="blue" 
                                  variant="text"
                                  className="flex items-center gap-1"
                                  onClick={() => setActiveTab("map")}
                                >
                                  <MapIcon fontSize="small" /> View on Map
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tracking Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Typography variant="h6" color="blue-gray" className="mb-4 border-b pb-2">
                            Tracking Information
                          </Typography>
                          <div className="space-y-3">
                            {fieldGroups.tracking.map((field) => (
                              <div key={field} className="grid grid-cols-2 items-center">
                                <div className="flex items-center gap-2">
                                  {getFieldIcon(field)}
                                  <Typography variant="small" color="blue-gray" className="font-medium">
                                    {fieldLabels[field]}:
                                  </Typography>
                                </div>
                                <Typography variant="small">{formatFieldValue(field, wntd[field])}</Typography>
                              </div>
                            ))}
                            {/* Artefacts */}
                            {wntd.artefacts && (
                              <div className="grid grid-cols-2 items-center">
                                <div className="flex items-center gap-2">
                                  {getFieldIcon('artefacts')}
                                  <Typography variant="small" color="blue-gray" className="font-medium">
                                    Artefacts:
                                  </Typography>
                                </div>
                                <div>
                                  {formatFieldValue("artefacts", wntd.artefacts)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabPanel>

                    <TabPanel value="history">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <Typography variant="h6" color="blue-gray" className="mb-4 border-b pb-2">
                          Change History Timeline
                        </Typography>
                        
                        {timeline && timeline.length > 0 ? (
                          <Timeline items={timeline.map(item => ({
                            id: item.id,
                            title: `${fieldLabels[item.field_name] || item.field_name} changed`,
                            description: `Changed from "${item.old_value || '-'}" to "${item.new_value || '-'}"`,
                            date: item.formatted_date,
                            user: item.user_name,
                            category: item.category
                          }))} />
                        ) : (
                          <Typography>No history records found for this WNTD record.</Typography>
                        )}
                      </div>
                    </TabPanel>

                    {wntd.lon && wntd.lat && (
                      <TabPanel value="map">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Typography variant="h6" color="blue-gray" className="mb-4 border-b pb-2">
                            Location Map
                          </Typography>
                          <div className="h-[500px] w-full">
                            <iframe
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              src={`https://maps.google.com/maps?q=${wntd.lat},${wntd.lon}&hl=en&z=14&output=embed`}
                              allowFullScreen
                            ></iframe>
                          </div>
                          <div className="mt-4 flex justify-between items-center">
                            <div>
                              <Typography variant="small" className="font-medium">
                                Coordinates: {wntd.lat}, {wntd.lon}
                              </Typography>
                            </div>
                            <Tooltip content="Open in Google Maps">
                              <Button 
                                size="sm" 
                                color="blue" 
                                variant="outlined"
                                className="flex items-center gap-1"
                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${wntd.lat},${wntd.lon}`, '_blank')}
                              >
                                Open in Google Maps
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                      </TabPanel>
                    )}
                  </TabsBody>
                </Tabs>
              </div>
            </Card>
          </ErrorBoundary>
        </div>
      </div>
    </Authenticated>
  );
}
