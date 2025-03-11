import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { 
  Typography, 
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option
} from "@material-tailwind/react";
import {
  FiPlus,
  FiEdit,
  FiTrash,
  FiExternalLink,
  FiBarChart2,
  FiLayers,
  FiWifi,
  FiHome,
  FiSettings,
  FiUsers,
  FiX,
  FiSearch,
  FiGrid,
  FiList,
  FiChevronRight,
  FiRefreshCw
} from "react-icons/fi";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// Helper: Check for localStorage availability
const isLocalStorageAvailable = () => {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.error("localStorage is not available:", error);
    return false;
  }
};

// Default tools list (icons match the available icon set below)
const defaultTools = [
  { id: 1, name: "FWP Tracker", description: "Track and manage FWP performance.", url: "https://fwpm.nwas.nbnco.net.au/wntd/", icon: "FiBarChart2" },
  { id: 2, name: "WNTD Overlay Tool", description: "WNTD Reparenting and Load Balancing Tool.", url: "https://fwpm.nwas.nbnco.net.au/overlay/", icon: "FiLayers" },
  { id: 3, name: "UE Signaling Trace", description: "Visualize LTE signaling traces.", url: "https://fwpm.nwas.nbnco.net.au/signaling/", icon: "FiWifi" },
  { id: 4, name: "ENM Script Generator", description: "Generate ENM implementation scripts.", url: "https://fwpm.nwas.nbnco.net.au/enm/", icon: "FiUsers" },
  { id: 5, name: "Planet MASE Processor", description: "Generate and process Planet projects.", url: "https://fwpm.nwas.nbnco.net.au/mase/", icon: "FiHome" },
  { id: 6, name: "KML Generator", description: "Generate Google KML for Site and WNTD", url: "https://fwpm.nwas.nbnco.net.au/kml/", icon: "FiSettings" },
  { id: 7, name: "RAN KPI Dashboard", description: "LTE and NR KPI performance insights.", url: "https://biatableau.nbnco.net.au/#/views/FWKPIPerformance/kpi_lte", icon: "FiBarChart2" },
  { id: 8, name: "WNTD Time-Series", description: "View WNTD radio and speed performance stats.", url: "https://biatableau.nbnco.net.au/#/views/WNTDTime-SeriesStats/TR135ts", icon: "FiWifi" },
  { id: 9, name: "HST Subscribers", description: "View HST subscribers summary and optimization.", url: "https://biatableau.nbnco.net.au/#/views/FWSUP-50MOptimization/HSTSubscribers", icon: "FiLayers" },
];

export default function ToolsManager({ auth }) {
  // Initialize tools from localStorage (if available) or use default list
  const [tools, setTools] = useState(() => {
    if (isLocalStorageAvailable()) {
      const savedTools = localStorage.getItem("tools");
      return savedTools ? JSON.parse(savedTools) : defaultTools;
    }
    return defaultTools;
  });

  // View state (grid or list)
  const [viewType, setViewType] = useState(() => {
    if (isLocalStorageAvailable()) {
      return localStorage.getItem("viewType") || "grid";
    }
    return "grid";
  });
  
  // Modal and form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTool, setNewTool] = useState({ name: "", description: "", url: "", icon: "FiBarChart2" });
  const [editTool, setEditTool] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Save changes to localStorage whenever tools change
  useEffect(() => {
    if (isLocalStorageAvailable()) {
      localStorage.setItem("tools", JSON.stringify(tools));
      localStorage.setItem("viewType", viewType);
    }
  }, [tools, viewType]);

  // Create a reference to detect dark mode from the root element
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    // Check on mount
    checkDarkMode();
    
    // Set up a mutation observer to detect class changes on the root element
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  // Helper function: Generate a unique id using the maximum existing id
  const generateUniqueId = () => {
    const ids = tools.map(tool => tool.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  };

  // Add tool handler (includes URL validation and duplicate checking)
  const handleAddTool = () => {
    // Basic validation
    if (!newTool.name.trim() || !newTool.url.trim()) {
      alert("Name and URL are required fields.");
      return;
    }

    // URL validation
    try {
      new URL(newTool.url);
    } catch (e) {
      alert("Please enter a valid URL (include http:// or https://)");
      return;
    }

    // Add new tool with a unique ID
    const updatedTools = [
      ...tools,
      { ...newTool, id: generateUniqueId() }
    ];
    
    setTools(updatedTools);
    setNewTool({ name: "", description: "", url: "", icon: "FiBarChart2" });
    setShowAddModal(false);
  };

  // Edit tool handler
  const handleSaveEdit = () => {
    if (!editTool.name.trim() || !editTool.url.trim()) {
      alert("Name and URL are required fields.");
      return;
    }

    try {
      new URL(editTool.url);
    } catch (e) {
      alert("Please enter a valid URL (include http:// or https://)");
      return;
    }

    const updatedTools = tools.map(tool => 
      tool.id === editTool.id ? editTool : tool
    );
    
    setTools(updatedTools);
    setShowEditModal(false);
  };

  // Delete tool handler
  const handleDeleteTool = (id) => {
    if (window.confirm("Are you sure you want to remove this tool?")) {
      const updatedTools = tools.filter(tool => tool.id !== id);
      setTools(updatedTools);
    }
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    if (window.confirm("This will reset all tools to default settings. Continue?")) {
      setTools(defaultTools);
      setViewType("grid");
    }
  };

  // Drag and drop reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(tools);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setTools(items);
  };

  // Icon mapping for tool cards
  const iconMap = {
    "FiBarChart2": <FiBarChart2 size={24} />,
    "FiLayers": <FiLayers size={24} />,
    "FiWifi": <FiWifi size={24} />,
    "FiUsers": <FiUsers size={24} />,
    "FiHome": <FiHome size={24} />,
    "FiSettings": <FiSettings size={24} />,
    "FiExternalLink": <FiExternalLink size={24} />
  };
  
  const getIcon = (iconName) => iconMap[iconName] || iconMap["FiExternalLink"];

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Tools Manager" />

      <div className="py-3">
        <div className="mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div className="p-4 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Tools Manager
              </h1>
              <p className="text-gray-500 dark:text-gray-300 mt-1">
                Manage and organize your favorite tools and applications
              </p>
            </div>
          </div>

          <div className={`tools-container bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 ${isDarkMode ? 'border border-gray-700' : 'border border-gray-100'}`}>
            {/* Tools Header and Controls */}
            <div className="flex flex-wrap justify-between items-center mb-5">
              <div className="mb-2 sm:mb-0">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                  <FiSettings className="mr-2" /> Tools & Resources
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Drag and drop to rearrange your frequently used tools
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className={`relative flex items-center rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'} px-3 py-1.5 mr-2`}>
                  <FiSearch className="text-gray-400 mr-2" size={16} />
                  <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`outline-none text-sm ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 text-gray-700 placeholder-gray-400'}`}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <FiX size={14} />
                    </button>
                  )}
                </div>

                {/* View Toggle */}
                <div className={`rounded-lg overflow-hidden border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex`}>
                  <button
                    onClick={() => setViewType("grid")}
                    className={`p-2 flex items-center justify-center ${viewType === "grid" 
                      ? (isDarkMode ? 'bg-blue-900/80 text-white' : 'bg-blue-500 text-white') 
                      : (isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500')}`}
                  >
                    <FiGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewType("list")}
                    className={`p-2 flex items-center justify-center ${viewType === "list" 
                      ? (isDarkMode ? 'bg-blue-900/80 text-white' : 'bg-blue-500 text-white') 
                      : (isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500')}`}
                  >
                    <FiList size={18} />
                  </button>
                </div>

                {/* Add Tool Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className={`flex items-center py-2 px-3 rounded-lg ${isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                >
                  <FiPlus size={16} className="mr-1" /> Add Tool
                </button>
              </div>
            </div>

            {/* Tools Grid/List View */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="tools" direction={viewType === "list" ? "vertical" : "horizontal"}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={viewType === "grid" 
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
                      : "flex flex-col space-y-2"
                    }
                  >
                    {filteredTools.length === 0 ? (
                      <div className={`col-span-full py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <FiSearch size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No tools match your search criteria.</p>
                      </div>
                    ) : (
                      filteredTools.map((tool, index) => (
                        <Draggable key={tool.id} draggableId={tool.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {viewType === "grid" ? (
                                <div className={`group tool-card relative border rounded-xl overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white'} h-full transition-all hover:shadow-md`}>
                                  <div className={`absolute top-0 left-0 w-1 h-full ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}`}></div>
                                  <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-500'}`}>
                                        {getIcon(tool.icon)}
                                      </div>
                                      <div className="tools opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => {
                                            setEditTool(tool);
                                            setShowEditModal(true);
                                          }}
                                          className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                                        >
                                          <FiEdit size={15} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTool(tool.id)}
                                          className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-red-900/50 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'}`}
                                        >
                                          <FiTrash size={15} />
                                        </button>
                                      </div>
                                    </div>
                                    <h3 className={`font-semibold mb-1 text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{tool.name}</h3>
                                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{tool.description}</p>
                                    <a
                                      href={tool.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                    >
                                      Open Tool <FiChevronRight size={16} className="ml-1" />
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className={`group tool-row flex items-center border rounded-lg p-3 ${isDarkMode ? 'border-gray-700 bg-gray-900/50 hover:bg-gray-800/70' : 'border-gray-200 bg-white hover:bg-gray-50'} transition-all`}>
                                  <div className={`p-2 rounded-lg mr-4 ${isDarkMode ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-500'}`}>
                                    {getIcon(tool.icon)}
                                  </div>
                                  <div className="flex-grow">
                                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{tool.name}</h3>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{tool.description}</p>
                                  </div>
                                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                      href={tool.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`p-2 rounded-md ${isDarkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'} mr-1`}
                                    >
                                      <FiExternalLink size={16} />
                                    </a>
                                    <button
                                      onClick={() => {
                                        setEditTool(tool);
                                        setShowEditModal(true);
                                      }}
                                      className={`p-2 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} mr-1`}
                                    >
                                      <FiEdit size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTool(tool.id)}
                                      className={`p-2 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-red-900/30' : 'text-gray-500 hover:bg-red-50'}`}
                                    >
                                      <FiTrash size={16} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            {/* Tools Footer with Reset Button */}
            <div className="flex justify-end mt-5 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleResetDefaults}
                className={`flex items-center py-1.5 px-3 rounded-lg ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FiRefreshCw size={14} className="mr-2" /> Reset to defaults
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Tool Modal */}
      <Dialog open={showAddModal} handler={() => setShowAddModal(false)} size="sm">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center">
            <FiPlus size={18} className="mr-2 text-blue-500" />
            <Typography variant="h5" className="text-gray-800 dark:text-white">
              Add New Tool
            </Typography>
          </div>
        </DialogHeader>
        <DialogBody className="pt-4">
          <div className="space-y-4">
            <div>
              <Typography variant="small" className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                Tool Name*
              </Typography>
              <Input
                size="lg"
                placeholder="Enter tool name"
                value={newTool.name}
                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                className="!border-gray-300 focus:!border-blue-500"
              />
            </div>
            
            <div>
              <Typography variant="small" className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                Description
              </Typography>
              <Input
                size="lg"
                placeholder="Enter short description"
                value={newTool.description}
                onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                className="!border-gray-300 focus:!border-blue-500"
              />
            </div>
            
            <div>
              <Typography variant="small" className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                URL*
              </Typography>
              <Input
                size="lg"
                placeholder="https://example.com"
                value={newTool.url}
                onChange={(e) => setNewTool({ ...newTool, url: e.target.value })}
                className="!border-gray-300 focus:!border-blue-500"
              />
            </div>
            
            <div>
              <Typography variant="small" className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                Icon
              </Typography>
              <Select
                placeholder="Select icon"
                value={newTool.icon}
                onChange={(value) => setNewTool({ ...newTool, icon: value })}
                className="!border-gray-300"
              >
                <Option value="FiBarChart2">Analytics</Option>
                <Option value="FiLayers">Layers</Option>
                <Option value="FiWifi">Wireless</Option>
                <Option value="FiUsers">Users</Option>
                <Option value="FiHome">Home</Option>
                <Option value="FiSettings">Settings</Option>
                <Option value="FiExternalLink">External Link</Option>
              </Select>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="space-x-2 border-t pt-3">
          <Button 
            variant="outlined" 
            color="gray" 
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="filled"
            color="blue" 
            onClick={handleAddTool}
          >
            Add Tool
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Tool Modal */}
      <Dialog open={showEditModal} handler={() => setShowEditModal(false)} size="sm">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center">
            <FiEdit size={18} className="mr-2 text-blue-500" />
            <Typography variant="h5" className="text-gray-800 dark:text-white">
              Edit Tool
            </Typography>
          </div>
        </DialogHeader>
        <DialogBody className="pt-4">
          {editTool ? (
            <div className="space-y-4">
              <div>
                <Typography variant="small" className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                  Tool Name*
                </Typography>
                <Input
                  size="lg"
                  placeholder="Enter tool name"
                  value={editTool.name}
                  onChange={(e) => setEditTool({ ...editTool, name: e.target.value })}
                  className="!border-gray-300 focus:!border-blue-500"
                />
              </div>
              
              <div>
                <Typography variant="small" className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                  Description
                </Typography>
                <Input
                  size="lg"
                  placeholder="Enter short description"
                  value={editTool.description}
                  onChange={(e) => setEditTool({ ...editTool, description: e.target.value })}
                  className="!border-gray-300 focus:!border-blue-500"
                />
              </div>
              
              <div>
                <Typography variant="small" className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                  URL*
                </Typography>
                <Input
                  size="lg"
                  placeholder="https://example.com"
                  value={editTool.url}
                  onChange={(e) => setEditTool({ ...editTool, url: e.target.value })}
                  className="!border-gray-300 focus:!border-blue-500"
                />
              </div>
              
              <div>
                <Typography variant="small" className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                  Icon
                </Typography>
                <Select
                  placeholder="Select icon"
                  value={editTool.icon}
                  onChange={(value) => setEditTool({ ...editTool, icon: value })}
                  className="!border-gray-300"
                >
                  <Option value="FiBarChart2">Analytics</Option>
                  <Option value="FiLayers">Layers</Option>
                  <Option value="FiWifi">Wireless</Option>
                  <Option value="FiUsers">Users</Option>
                  <Option value="FiHome">Home</Option>
                  <Option value="FiSettings">Settings</Option>
                  <Option value="FiExternalLink">External Link</Option>
                </Select>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <Typography variant="paragraph" color="blue-gray">
                Loading tool data...
              </Typography>
            </div>
          )}
        </DialogBody>
        <DialogFooter className="space-x-2 border-t pt-3">
          <Button 
            variant="outlined" 
            color="gray" 
            onClick={() => setShowEditModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="filled"
            color="blue" 
            onClick={handleSaveEdit}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </Dialog>
    </AuthenticatedLayout>
  );
} 