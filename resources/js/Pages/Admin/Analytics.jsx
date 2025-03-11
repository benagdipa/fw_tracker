import React from "react";
import { Head } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
  Card,
  CardBody,
  Typography,
  Button,
} from "@material-tailwind/react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  UsersIcon,
  ServerIcon,
  DocumentTextIcon,
  ClockIcon,
  MapIcon,
  DevicePhoneMobileIcon,
  DocumentDuplicateIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, change, changeType }) => {
  const isPositive = changeType === "positive";
  
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-md ${isPositive ? 'bg-green-100' : 'bg-blue-100'}`}>
            <Icon className={`h-5 w-5 ${isPositive ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          {change && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <ArrowUpIcon className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-3.5 w-3.5 text-red-500" />
              )}
              <Typography
                variant="small"
                className={`font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}
              >
                {change}%
              </Typography>
            </div>
          )}
        </div>
        <Typography color="blue-gray" className="font-normal mb-1">
          {title}
        </Typography>
        <Typography variant="h4" color="blue-gray" className="font-bold">
          {value}
        </Typography>
      </CardBody>
    </Card>
  );
};

export default function Analytics({ auth, userStats, siteStats, activityStats, systemInfo, error }) {
  // Ensure we have data with defaults if needed
  const users = userStats || { 
    total: 0, 
    byRole: { superAdmin: 0, admin: 0, editor: 0, user: 0 },
    active: 0
  };
  
  const sites = siteStats || { 
    total: 0, 
    byStatus: { active: 0, planning: 0, maintenance: 0, decommissioned: 0 },
    recentlyAdded: 0
  };
  
  const activity = activityStats || {
    logins: 0,
    dataEntries: 0,
    dataExports: 0,
    dataImports: 0
  };
  
  const system = systemInfo || {
    uptime: 'Unknown',
    version: '1.0.0',
    lastBackup: 'Never'
  };

  // Only allow admin users to access
  if (auth.role !== "super-admin" && auth.role !== "admin") {
    return (
      <Authenticated user={auth.user}>
        <Head title="Access Denied" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Authenticated>
    );
  }

  // Chart data and options
  const userRolesData = {
    labels: ['Super Admin', 'Admin', 'Editor', 'User'],
    datasets: [
      {
        label: 'Users by Role',
        data: [
          users.byRole.superAdmin, 
          users.byRole.admin, 
          users.byRole.editor, 
          users.byRole.user
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(107, 114, 128, 0.7)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(107, 114, 128)',
        ],
        borderWidth: 1
      }
    ]
  };
  
  const siteStatusData = {
    labels: ['Active', 'Planning', 'Maintenance', 'Decommissioned'],
    datasets: [
      {
        label: 'Sites by Status',
        data: [
          sites.byStatus.active,
          sites.byStatus.planning,
          sites.byStatus.maintenance,
          sites.byStatus.decommissioned
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderWidth: 0
      }
    ]
  };

  const activityData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Data Entries',
        data: [65, 78, 66, 44, 56, 67],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      }
    ]
  };

  return (
    <Authenticated user={auth.user}>
      <Head title="Analytics Dashboard" />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                <p className="text-gray-600 max-w-2xl">
                  View system metrics, user activity, and performance data.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outlined" color="gray" className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          {/* Error message if any */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Users"
              value={users.total}
              icon={UsersIcon}
              change="8.2"
              changeType="positive"
            />
            <StatCard
              title="Active Sites"
              value={sites.byStatus.active}
              icon={MapIcon}
              change="5.3"
              changeType="positive"
            />
            <StatCard
              title="Data Entries"
              value={activity.dataEntries}
              icon={DocumentDuplicateIcon}
              change="12.5"
              changeType="positive"
            />
            <StatCard
              title="WNTD Devices"
              value={sites.total * 2} // Example calculation
              icon={DevicePhoneMobileIcon}
              change="3.1"
              changeType="positive"
            />
          </div>

          {/* System Information */}
          <Card className="mb-6">
            <CardBody className="p-6">
              <Typography variant="h6" color="blue-gray" className="mb-4">
                System Information
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-50">
                    <ClockIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <Typography color="gray" className="text-sm font-medium">
                      System Uptime
                    </Typography>
                    <Typography color="blue-gray" className="font-medium">
                      {system.uptime}
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-50">
                    <ServerIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <Typography color="gray" className="text-sm font-medium">
                      System Version
                    </Typography>
                    <Typography color="blue-gray" className="font-medium">
                      {system.version}
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-50">
                    <RocketLaunchIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <Typography color="gray" className="text-sm font-medium">
                      Database Status
                    </Typography>
                    <Typography color="blue-gray" className="font-medium">
                      Connected
                    </Typography>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Roles Chart */}
            <Card>
              <CardBody className="p-6">
                <Typography variant="h6" color="blue-gray" className="mb-4">
                  User Distribution by Role
                </Typography>
                <div className="h-80">
                  <Doughnut 
                    data={userRolesData} 
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        }
                      }
                    }}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Site Status Chart */}
            <Card>
              <CardBody className="p-6">
                <Typography variant="h6" color="blue-gray" className="mb-4">
                  Sites by Status
                </Typography>
                <div className="h-80">
                  <Doughnut 
                    data={siteStatusData} 
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        }
                      }
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Activity Chart */}
          <Card>
            <CardBody className="p-6">
              <Typography variant="h6" color="blue-gray" className="mb-4">
                System Activity (Last 6 Months)
              </Typography>
              <div className="h-80">
                <Bar 
                  data={activityData} 
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </Authenticated>
  );
} 