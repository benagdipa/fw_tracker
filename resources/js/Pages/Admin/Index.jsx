import React from "react";
import { Head } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Progress,
  Alert,
} from "@material-tailwind/react";
import {
  UsersIcon,
  ServerIcon,
  DocumentTextIcon,
  ClockIcon,
  MapIcon,
  DevicePhoneMobileIcon,
  DocumentDuplicateIcon,
  RocketLaunchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  UserGroupIcon,
  CpuChipIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: 'rgb(156, 163, 175)'
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(156, 163, 175, 0.1)'
      },
      ticks: {
        color: 'rgb(156, 163, 175)'
      }
    },
    y: {
      grid: {
        color: 'rgba(156, 163, 175, 0.1)'
      },
      ticks: {
        color: 'rgb(156, 163, 175)'
      }
    }
  }
};

// Admin navigation card component
const AdminCard = ({ title, description, icon: Icon, href, color }) => (
  <Card
    className="cursor-pointer transform transition-all hover:scale-105 dark:bg-gray-800"
    onClick={() => window.location.href = href}
  >
    <CardBody className="p-4">
      <div className={`w-12 h-12 ${color} rounded-lg mb-4 flex items-center justify-center`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <Typography variant="h6" color="blue-gray" className="mb-2 dark:text-gray-200">
        {title}
      </Typography>
      <Typography variant="small" className="text-gray-600 dark:text-gray-400">
        {description}
      </Typography>
    </CardBody>
  </Card>
);

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, change, changeType, subtitle }) => {
  const isPositive = changeType === "positive";
  
  return (
    <Card className="dark:bg-gray-800">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-md ${isPositive ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
            <Icon className={`h-5 w-5 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
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
        <Typography className="font-normal mb-1 text-gray-700 dark:text-gray-300">
          {title}
        </Typography>
        <Typography variant="h4" className="font-bold mb-1 text-gray-900 dark:text-white">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="small" className="text-gray-500 dark:text-gray-400">
            {subtitle}
          </Typography>
        )}
      </CardBody>
    </Card>
  );
};

// System Health Card Component
const SystemHealthCard = ({ title, value, icon: Icon, status }) => {
  const getStatusColor = (status) => {
    const colors = {
      good: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-600 dark:text-green-400',
        progress: 'bg-green-500'
      },
      warning: {
        bg: 'bg-yellow-100 dark:bg-yellow-900',
        text: 'text-yellow-600 dark:text-yellow-400',
        progress: 'bg-yellow-500'
      },
      critical: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-600 dark:text-red-400',
        progress: 'bg-red-500'
      }
    };
    return colors[status] || colors.good;
  };

  const statusColor = getStatusColor(status);
  const progressValue = status === 'good' ? 100 : status === 'warning' ? 60 : 30;

  return (
    <Card className="dark:bg-gray-800">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-md ${statusColor.bg}`}>
            <Icon className={`h-5 w-5 ${statusColor.text}`} />
          </div>
        </div>
        <Typography className="font-normal mb-1 text-gray-700 dark:text-gray-300">
          {title}
        </Typography>
        <Typography variant="h4" className="font-bold mb-3 text-gray-900 dark:text-white">
          {value}
        </Typography>
        <Progress value={progressValue} className={statusColor.progress} />
      </CardBody>
    </Card>
  );
};

export default function Index({ auth, stats = {}, error }) {
  const { role } = auth;

  // Default values for stats
  const defaultStats = {
    users: {
      total: 0,
      active: 0,
      byRole: {
        superAdmin: 0,
        admin: 0,
        editor: 0,
        user: 0,
      },
      recentlyAdded: 0,
    },
    sites: {
      total: 0,
      active: 0,
      byStatus: {
        active: 0,
        planning: 0,
        maintenance: 0,
        decommissioned: 0,
      },
      recentlyAdded: 0,
    },
    devices: {
      total: 0,
      active: 0,
      recentlyAdded: 0,
    },
    ranParameters: {
      total: 0,
      recentlyAdded: 0,
    },
    systemHealth: {
      diskUsage: 0,
      memoryUsage: 0,
      phpVersion: '',
      laravelVersion: '',
    },
  };

  // Merge provided stats with default values
  const mergedStats = {
    ...defaultStats,
    ...stats,
    users: { ...defaultStats.users, ...stats?.users },
    sites: { ...defaultStats.sites, ...stats?.sites },
    devices: { ...defaultStats.devices, ...stats?.devices },
    ranParameters: { ...defaultStats.ranParameters, ...stats?.ranParameters },
    systemHealth: { ...defaultStats.systemHealth, ...stats?.systemHealth },
  };

  // Chart data
  const userActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Active Users',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const resourceData = {
    labels: ['Users', 'Sites', 'Devices', 'Parameters'],
    datasets: [
      {
        data: [
          mergedStats.users.total,
          mergedStats.sites.total,
          mergedStats.devices.total,
          mergedStats.ranParameters.total,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(139, 92, 246, 0.5)',
          'rgba(34, 197, 94, 0.5)',
          'rgba(249, 115, 22, 0.5)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(139, 92, 246)',
          'rgb(34, 197, 94)',
          'rgb(249, 115, 22)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Only allow admin users to access
  if (role !== "super-admin" && role !== "admin") {
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

  // Calculate percentage changes for stats
  const calculateChange = (current, total) => {
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  return (
    <Authenticated user={auth.user}>
      <Head title="Admin Dashboard" />
      <div className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4">
              <Alert
                color="red"
                icon={<ExclamationCircleIcon className="h-6 w-6" />}
                className="dark:bg-red-900 dark:border-red-800"
              >
                {error}
              </Alert>
            </div>
          )}

          {/* Quick Access Grid */}
          <div className="mb-8">
            <Typography variant="h4" className="mb-4 text-gray-900 dark:text-white">
              Quick Access
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AdminCard
                title="User Management"
                description="Manage user accounts and roles"
                icon={UsersIcon}
                href={route('admin.users')}
                color="bg-blue-500"
              />
              <AdminCard
                title="System Settings"
                description="Configure system parameters"
                icon={Cog6ToothIcon}
                href={route('admin.settings')}
                color="bg-purple-500"
              />
              <AdminCard
                title="Analytics"
                description="View system analytics and reports"
                icon={ChartBarIcon}
                href={route('admin.analytics')}
                color="bg-green-500"
              />
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="mb-8">
            <Typography variant="h4" className="mb-4 text-gray-900 dark:text-white">
              System Overview
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={mergedStats.users.total}
                icon={UsersIcon}
                change={calculateChange(mergedStats.users.recentlyAdded, mergedStats.users.total)}
                changeType="positive"
                subtitle={`${mergedStats.users.active} active in last 30 days`}
              />
              <StatCard
                title="Total Sites"
                value={mergedStats.sites.total}
                icon={MapIcon}
                change={calculateChange(mergedStats.sites.recentlyAdded, mergedStats.sites.total)}
                changeType="positive"
                subtitle={`${mergedStats.sites.active} active sites`}
              />
              <StatCard
                title="Devices"
                value={mergedStats.devices.total}
                icon={DevicePhoneMobileIcon}
                change={calculateChange(mergedStats.devices.recentlyAdded, mergedStats.devices.total)}
                changeType="positive"
                subtitle={`${mergedStats.devices.active} active devices`}
              />
              <StatCard
                title="RAN Parameters"
                value={mergedStats.ranParameters.total}
                icon={CpuChipIcon}
                change={calculateChange(mergedStats.ranParameters.recentlyAdded, mergedStats.ranParameters.total)}
                changeType="positive"
                subtitle={`${mergedStats.ranParameters.recentlyAdded} new this week`}
              />
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="dark:bg-gray-800">
              <CardBody>
                <Typography variant="h6" className="mb-4 text-gray-900 dark:text-white">
                  User Activity
                </Typography>
                <div className="h-[300px] w-full">
                  <Bar
                    data={userActivityData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          labels: {
                            color: 'rgb(156, 163, 175)'
                          }
                        }
                      },
                      scales: {
                        x: {
                          ...chartOptions.scales.x,
                          ticks: {
                            color: 'rgb(156, 163, 175)'
                          },
                          grid: {
                            color: 'rgba(156, 163, 175, 0.1)'
                          }
                        },
                        y: {
                          ...chartOptions.scales.y,
                          ticks: {
                            color: 'rgb(156, 163, 175)'
                          },
                          grid: {
                            color: 'rgba(156, 163, 175, 0.1)'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardBody>
            </Card>

            <Card className="dark:bg-gray-800">
              <CardBody>
                <Typography variant="h6" className="mb-4 text-gray-900 dark:text-white">
                  Resource Distribution
                </Typography>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <Doughnut
                    data={resourceData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          labels: {
                            color: 'rgb(156, 163, 175)'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* System Health Grid */}
          <div className="mb-8">
            <Typography variant="h4" className="mb-4 text-gray-900 dark:text-white">
              System Health
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SystemHealthCard
                title="Disk Usage"
                value={`${Math.round(mergedStats.systemHealth.diskUsage)}%`}
                icon={ServerIcon}
                status={mergedStats.systemHealth.diskUsage > 90 ? 'critical' : mergedStats.systemHealth.diskUsage > 70 ? 'warning' : 'good'}
              />
              <SystemHealthCard
                title="Memory Usage"
                value={`${Math.round(mergedStats.systemHealth.memoryUsage)}%`}
                icon={CpuChipIcon}
                status={mergedStats.systemHealth.memoryUsage > 90 ? 'critical' : mergedStats.systemHealth.memoryUsage > 70 ? 'warning' : 'good'}
              />
              <Card className="dark:bg-gray-800">
                <CardBody className="p-4">
                  <Typography variant="h6" className="mb-4 text-gray-900 dark:text-white">
                    System Information
                  </Typography>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Typography className="text-gray-600 dark:text-gray-400">PHP Version</Typography>
                      <Typography className="text-gray-900 dark:text-white">{mergedStats.systemHealth.phpVersion}</Typography>
                    </div>
                    <div className="flex justify-between">
                      <Typography className="text-gray-600 dark:text-gray-400">Laravel Version</Typography>
                      <Typography className="text-gray-900 dark:text-white">{mergedStats.systemHealth.laravelVersion}</Typography>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Authenticated>
  );
} 