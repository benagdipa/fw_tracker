import React, { useState } from 'react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Typography, 
  Button, 
  IconButton,
  Tooltip,
  Chip
} from '@material-tailwind/react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import '../../css/data-grid-custom.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { UserPlusIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import AddUser from '@/Components/Roles/AddUser';

export default function Index({ auth, roles, noRoles }) {
  const [activeTab, setActiveTab] = useState('roles');

  // Define Material UI theme
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

  // Format roles data for DataGrid
  const rolesData = roles.map((role, index) => ({
    id: role.id || index + 1,
    name: role.name,
    userCount: role.name === 'user' ? role.users_count + noRoles : role.users_count,
    guardName: role.guard_name || 'web',
    createdAt: role.created_at || new Date().toISOString(),
  }));

  // Define columns for DataGrid
  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70 
    },
    { 
      field: 'name', 
      headerName: 'Role Name', 
      width: 220,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium capitalize">{params.value}</span>
        </div>
      ),
    },
    { 
      field: 'userCount', 
      headerName: 'User Count', 
      width: 150,
      renderCell: (params) => (
        <Chip
          value={params.value}
          size="sm"
          variant={params.value > 0 ? "gradient" : "outlined"}
          color={params.value > 0 ? "blue" : "gray"}
          className="rounded-full"
        />
      ),
    },
    { 
      field: 'guardName', 
      headerName: 'Guard Name', 
      width: 150 
    },
    { 
      field: 'createdAt', 
      headerName: 'Created At', 
      width: 200,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Tooltip content="Edit Permissions">
            <Link href={route('roles.access')}>
              <IconButton
                variant="text"
                color="blue"
                className="p-2 bg-blue-50 hover:bg-blue-100"
              >
                <ShieldCheckIcon className="h-4 w-4" />
              </IconButton>
            </Link>
          </Tooltip>
          <Tooltip content="Add User to Role">
            <IconButton
              variant="text"
              color="green"
              className="p-2 bg-green-50 hover:bg-green-100"
            >
              <UserPlusIcon className="h-4 w-4 text-green-600" />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Authenticated user={auth?.user}>
      <Head title='Role Management' />
      <div className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
        {/* Header Section */}
        <Card className="mb-6 shadow-sm rounded-xl overflow-hidden">
          <CardHeader
            color="transparent"
            floated={false}
            shadow={false}
            className="pt-6 px-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <Typography variant="h4" color="blue-gray" className="font-bold">
                  Role Management
                </Typography>
                <Typography color="gray" className="mt-1 text-sm font-normal">
                  Manage roles and role-based permissions across the platform
                </Typography>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={route('roles.access')}>
                  <Button
                    size="md"
                    color="blue"
                    variant="outlined"
                    className="flex items-center gap-2"
                  >
                    <ShieldCheckIcon className="h-4 w-4" /> Manage Permissions
                  </Button>
                </Link>
                <AddUser roles={roles}>
                  <Button
                    size="md"
                    color="blue"
                    className="flex items-center gap-2"
                  >
                    <UserPlusIcon className="h-4 w-4" /> Assign User to Role
                  </Button>
                </AddUser>
              </div>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-6 pt-2">
            <div style={{ height: 500, width: "100%" }}>
              <ThemeProvider theme={theme}>
                <DataGrid
                  rows={rolesData}
                  columns={columns}
                  pagination
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 10, page: 0 },
                    },
                  }}
                  pageSizeOptions={[5, 10, 25]}
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
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell:focus': {
                      outline: 'none',
                    },
                  }}
                />
              </ThemeProvider>
            </div>
          </CardBody>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <ShieldCheckIcon className="h-8 w-8" />
                </div>
                <div>
                  <Typography variant="small" color="blue-gray" className="font-medium">
                    Total Roles
                  </Typography>
                  <Typography variant="h5" color="blue-gray" className="font-bold">
                    {roles.length}
                  </Typography>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <UserPlusIcon className="h-8 w-8" />
                </div>
                <div>
                  <Typography variant="small" color="blue-gray" className="font-medium">
                    Users with Roles
                  </Typography>
                  <Typography variant="h5" color="blue-gray" className="font-bold">
                    {roles.reduce((sum, role) => sum + role.users_count, 0)}
                  </Typography>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                  <ArrowPathIcon className="h-8 w-8" />
                </div>
                <div>
                  <Typography variant="small" color="blue-gray" className="font-medium">
                    Users Without Roles
                  </Typography>
                  <Typography variant="h5" color="blue-gray" className="font-bold">
                    {noRoles}
                  </Typography>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Help Card */}
        <Card className="shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <CardBody className="p-4">
            <Typography variant="h6" color="blue" className="mb-2">
              How Role Management Works
            </Typography>
            <Typography variant="small" className="text-gray-600">
              Roles define what actions users can perform in the system. Assign roles to users to control their access to different features and functionalities. 
              Use the "Manage Permissions" button to configure specific permissions for each role.
            </Typography>
          </CardBody>
        </Card>
      </div>
    </Authenticated>
  );
}