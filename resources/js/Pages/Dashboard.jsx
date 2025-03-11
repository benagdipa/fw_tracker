import React, { useState, useEffect, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Tabs,
  TabsHeader,
  Tab,
  TabsBody,
  TabPanel,
  Progress,
  List,
  ListItem,
  ListItemPrefix,
  Alert
} from "@material-tailwind/react";
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
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  FiBarChart2,
  FiWifi,
  FiSettings,
  FiUsers,
  FiActivity,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiServer,
  FiDatabase,
  FiCpu
} from "react-icons/fi";

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

// Status color mapping with dark mode support
const statusColorMap = {
  'in_progress': { light: 'blue', dark: 'blue-400' },
  'completed': { light: 'green', dark: 'green-400' },
  'not_started': { light: 'amber', dark: 'amber-400' },
  'pending': { light: 'amber', dark: 'amber-400' },
  'active': { light: 'blue', dark: 'blue-400' },
  'blocked': { light: 'red', dark: 'red-400' }
};

const Dashboard = ({ 
  auth, 
  stats = {
    implementations: { total: 0, in_progress: 0, completed: 0, pending: 0, trend: null },
    wntd: { total: 0, unique_versions: 0, recent: 0, trend: null },
    ran: { total_parameters: 0, active_parameters: 0, technologies: [] }
  },
  implementationStatusDistribution = [],
  recentActivities = [],
  monthlyTrend = [],
  error
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Memoized chart options with dark mode support
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'currentColor',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'currentColor'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'currentColor'
        }
      }
    }
  }), []);

  // Monthly trend data with improved colors
  const trendData = {
    labels: monthlyTrend.map(item => item.month),
    datasets: [
      {
        label: 'Completed Implementations',
        data: monthlyTrend.map(item => item.completed),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'In Progress',
        data: monthlyTrend.map(item => item.in_progress),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Implementation status distribution data with improved colors
  const statusData = {
    labels: implementationStatusDistribution.map(item => (item?.status || '').replace('_', ' ')),
    datasets: [{
      data: implementationStatusDistribution.map(item => item?.count || 0),
      backgroundColor: implementationStatusDistribution.map(item => {
        const status = item?.status || '';
        switch(status) {
          case 'completed': return 'rgba(16, 185, 129, 0.8)';
          case 'in_progress': return 'rgba(59, 130, 246, 0.8)';
          case 'not_started': return 'rgba(245, 158, 11, 0.8)';
          case 'blocked': return 'rgba(239, 68, 68, 0.8)';
          default: return 'rgba(107, 114, 128, 0.8)';
        }
      }),
      borderWidth: 0
    }]
  };

  // Render trend indicator with improved styling
  const renderTrend = (trend) => {
    if (!trend) return null;
    
    const commonClasses = "flex items-center text-sm font-medium rounded-full px-2 py-1";
    if (trend.direction === 'up') {
      return (
        <div className={`${commonClasses} bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400`}>
          <FiTrendingUp className="w-4 h-4 mr-1" />
          <span>{trend.percentage}%</span>
        </div>
      );
    }
    
    return (
      <div className={`${commonClasses} bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400`}>
        <FiTrendingDown className="w-4 h-4 mr-1" />
        <span>{trend.percentage}%</span>
      </div>
    );
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Dashboard
        </h2>
      }
    >
      <Head title="Dashboard" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {error && (
            <Alert color="red" className="mb-6">
              {error}
            </Alert>
          )}

          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Implementation Stats */}
              <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <CardBody className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <Typography variant="small" className="font-medium text-gray-600 dark:text-gray-300">
                        Total Implementations
                      </Typography>
                      <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">
                        {stats.implementations.total}
                      </Typography>
                      {renderTrend(stats.implementations.trend)}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <FiBarChart2 className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <div>
                      <Typography variant="small" className="font-medium text-gray-600 dark:text-gray-300 mb-1">
                        In Progress
                      </Typography>
                      <Typography variant="h6" className="text-blue-500 dark:text-blue-400">
                        {stats.implementations.in_progress}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="small" className="font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Completed
                      </Typography>
                      <Typography variant="h6" className="text-green-500 dark:text-green-400">
                        {stats.implementations.completed}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="small" className="font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Pending
                      </Typography>
                      <Typography variant="h6" className="text-amber-500 dark:text-amber-400">
                        {stats.implementations.pending}
                      </Typography>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* WNTD Stats */}
              <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <CardBody className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <Typography variant="small" className="font-medium text-gray-600 dark:text-gray-300">
                        Total WNTD
                      </Typography>
                      <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">
                        {stats.wntd.total}
                      </Typography>
                      {renderTrend(stats.wntd.trend)}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                      <FiWifi className="w-6 h-6 text-green-500 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <Typography variant="small" className="font-medium text-gray-600 dark:text-gray-300">
                        Unique Versions
                      </Typography>
                      <Typography variant="small" className="font-bold text-gray-900 dark:text-white">
                        {stats.wntd.unique_versions}
                      </Typography>
                    </div>
                    <div className="flex justify-between">
                      <Typography variant="small" className="font-medium text-gray-600 dark:text-gray-300">
                        Recent Updates
                      </Typography>
                      <Typography variant="small" className="font-bold text-gray-900 dark:text-white">
                        {stats.wntd.recent}
                      </Typography>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* RAN Configuration Stats */}
              <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <CardBody className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <Typography variant="small" className="font-medium text-gray-600 dark:text-gray-300">
                        RAN Parameters
                      </Typography>
                      <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">
                        {stats?.ran?.total_parameters || 0}
                      </Typography>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                      <FiServer className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <Typography variant="small" className="font-medium text-gray-600 dark:text-gray-300">
                        Active Parameters
                      </Typography>
                      <Typography variant="small" className="font-bold text-gray-900 dark:text-white">
                        {stats?.ran?.active_parameters || 0}
                      </Typography>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stats?.ran?.technologies?.map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                        >
                          {tech}
                        </span>
                      )) || null}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Activity Stats */}
              <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <CardBody className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <Typography variant="small" className="font-medium text-gray-600 dark:text-gray-300">
                        Recent Activities
                      </Typography>
                      <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">
                        {recentActivities.length}
                      </Typography>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                      <FiActivity className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <List className="p-0">
                      {recentActivities.slice(0, 3).map((activity, index) => (
                        <ListItem key={index} className="py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <ListItemPrefix>
                            <span className={`w-2 h-2 rounded-full ${
                              activity.type === 'implementation' ? 'bg-blue-500 dark:bg-blue-400' :
                              activity.type === 'wntd' ? 'bg-green-500 dark:bg-green-400' :
                              'bg-purple-500 dark:bg-purple-400'
                            }`} />
                          </ListItemPrefix>
                          <div className="flex-1 min-w-0">
                            <Typography variant="small" className="text-gray-900 dark:text-gray-100 truncate">
                              {activity.title}
                            </Typography>
                            <Typography variant="small" className="text-gray-500 dark:text-gray-400 text-xs">
                              {activity.time}
                            </Typography>
                          </div>
                        </ListItem>
                      ))}
                    </List>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Charts and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Implementation Trend */}
              <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <CardHeader floated={false} shadow={false} className="rounded-none bg-transparent px-4 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Typography variant="h6" className="text-gray-900 dark:text-white mb-1">
                        Implementation Trend
                      </Typography>
                      <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                        Monthly progress overview
                      </Typography>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="px-2 pb-0">
                  <div className="h-[300px]">
                    <Line options={chartOptions} data={trendData} />
                  </div>
                </CardBody>
              </Card>

              {/* Implementation Status Distribution */}
              <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <CardHeader floated={false} shadow={false} className="rounded-none bg-transparent px-4 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Typography variant="h6" className="text-gray-900 dark:text-white mb-1">
                        Implementation Status
                      </Typography>
                      <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                        Current status distribution
                      </Typography>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="h-[300px]">
                    <Doughnut options={chartOptions} data={statusData} />
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Recent Activity Feed */}
            <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              <CardHeader floated={false} shadow={false} className="rounded-none bg-transparent px-4 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Typography variant="h6" className="text-gray-900 dark:text-white mb-1">
                      Recent Activity
                    </Typography>
                    <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                      Latest updates across all systems
                    </Typography>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flow-root">
                  <List className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentActivities.map((activity, index) => (
                      <ListItem key={index} className="py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <ListItemPrefix>
                          {activity.type === 'implementation' ? (
                            <FiBarChart2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                          ) : activity.type === 'wntd' ? (
                            <FiWifi className="h-5 w-5 text-green-500 dark:text-green-400" />
                          ) : (
                            <FiServer className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                          )}
                        </ListItemPrefix>
                        <div className="min-w-0 flex-1">
                          <Typography variant="small" className="font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </Typography>
                          <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </Typography>
                          <Typography variant="small" className="text-gray-500 dark:text-gray-400 mt-1">
                            {activity.time} by {activity.user}
                          </Typography>
                        </div>
                        {activity.status && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColorMap[activity.status]?.light === 'green' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                            statusColorMap[activity.status]?.light === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                            statusColorMap[activity.status]?.light === 'amber' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400' :
                            'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                          }`}>
                            {(activity.status || '').replace('_', ' ')}
                          </span>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Dashboard;
