import React, { useState, useEffect } from "react";
import { Head, useForm } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
  Card,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from "@material-tailwind/react";
import { DataGrid } from "@mui/x-data-grid";
import {
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { usePage } from "@inertiajs/react";
import axios from "axios";

export default function Users({ auth, users, availableRoles, error }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("success");
  const { flash } = usePage().props;

  // Check for flash messages
  useEffect(() => {
    if (flash.success) {
      setAlertMessage(flash.success);
      setAlertType("success");
      
      // Clear message after 5 seconds
      const timer = setTimeout(() => setAlertMessage(null), 5000);
      return () => clearTimeout(timer);
    }
    
    if (flash.error) {
      setAlertMessage(flash.error);
      setAlertType("error");
      
      // Clear message after 5 seconds
      const timer = setTimeout(() => setAlertMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  // Set error from props if provided
  useEffect(() => {
    if (error) {
      setAlertMessage(error);
      setAlertType("error");
    }
  }, [error]);

  // Form for creating new user
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    name: "",
    email: "",
    role: "",
    password: "",
    password_confirmation: "",
  });

  // Form for editing user
  const editForm = useForm({
    name: "",
    email: "",
    role: "",
  });

  // Reset form when dialog closes
  const resetForm = () => {
    reset();
    clearErrors();
  };

  // Set up edit form when user is selected
  useEffect(() => {
    if (selectedUser) {
      const role = selectedUser.roles && selectedUser.roles.length > 0 
        ? selectedUser.roles[0].name 
        : "";
      
      editForm.setData({
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        role: role,
      });
    }
  }, [selectedUser]);

  // Handle user creation
  const handleCreateUser = (e) => {
    e.preventDefault();
    post(route("admin.users.store"), {
      onSuccess: () => {
        setShowCreateDialog(false);
        resetForm();
      },
    });
  };

  // Handle user update
  const handleUpdateUser = (e) => {
    e.preventDefault();
    editForm.post(route("admin.users.update", { user: selectedUser.id }), {
      onSuccess: () => {
        setShowEditDialog(false);
        setSelectedUser(null);
      },
    });
  };

  // Handle user deletion
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    
    axios.delete(route("admin.users.delete", { user: selectedUser.id }))
      .then(() => {
        setAlertMessage("User deleted successfully");
        setAlertType("success");
        setShowDeleteDialog(false);
        setSelectedUser(null);
        
        // Refresh page to update user list
        window.location.reload();
      })
      .catch((error) => {
        setAlertMessage(error.response?.data?.error || "Failed to delete user");
        setAlertType("error");
        setShowDeleteDialog(false);
      });
  };

  // Check if user has permission to access
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

  // Format user data for DataGrid
  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles?.map((role) => role.name).join(', ') || 'No role',
    created_at: new Date(user.created_at).toLocaleDateString(),
  }));

  // Filter users based on search query
  const filteredUsers = formattedUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.roles.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // DataGrid columns
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    { 
      field: "roles", 
      headerName: "Roles", 
      width: 200,
      renderCell: (params) => {
        const roleNames = params.value.split(', ');
        return (
          <div className="flex gap-1 flex-wrap">
            {roleNames.map((role, index) => (
              <Chip
                key={index}
                value={role}
                size="sm"
                variant="ghost"
                color={
                  role === "super-admin" ? "red" :
                  role === "admin" ? "blue" :
                  role === "editor" ? "green" :
                  "gray"
                }
              />
            ))}
          </div>
        );
      }
    },
    { field: "created_at", headerName: "Created At", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => {
        const user = users.find((u) => u.id === params.row.id);
        const canEdit = auth.role === "super-admin" || 
          (auth.role === "admin" && !user.roles?.some(r => r.name === "super-admin"));
        
        const canDelete = auth.role === "super-admin" && 
          !user.roles?.some(r => r.name === "super-admin") || 
          (auth.role === "super-admin" && user.id !== auth.user.id);

        return (
          <div className="flex gap-2">
            {canEdit && (
              <Tooltip content="Edit User">
                <IconButton 
                  variant="text" 
                  color="blue" 
                  size="sm"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowEditDialog(true);
                  }}
                >
                  <PencilIcon className="h-5 w-5" />
                </IconButton>
              </Tooltip>
            )}
            
            {canDelete && (
              <Tooltip content="Delete User">
                <IconButton 
                  variant="text" 
                  color="red" 
                  size="sm"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowDeleteDialog(true);
                  }}
                >
                  <TrashIcon className="h-5 w-5" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Authenticated user={auth.user}>
      <Head title="User Management" />

      <div className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <Typography variant="h4" className="text-gray-900 dark:text-white">
                  User Management
                </Typography>
                <Typography className="mt-1 text-gray-600 dark:text-gray-400">
                  Manage user accounts, roles, and permissions
                </Typography>
              </div>
              <Button
                className="flex items-center gap-2"
                onClick={() => setShowCreateDialog(true)}
              >
                <PlusIcon className="h-4 w-4" />
                Add New User
              </Button>
            </div>
          </div>

          {/* Alert Messages */}
          {alertMessage && (
            <Alert
              color={alertType === "success" ? "green" : "red"}
              icon={alertType === "success" ? <CheckCircleIcon className="h-6 w-6" /> : <ExclamationCircleIcon className="h-6 w-6" />}
              className={`mb-4 ${alertType === "success" ? "dark:bg-green-900 dark:border-green-800" : "dark:bg-red-900 dark:border-red-800"}`}
              open={!!alertMessage}
              onClose={() => setAlertMessage(null)}
            >
              {alertMessage}
            </Alert>
          )}

          {/* Main Content */}
          <Card className="overflow-hidden dark:bg-gray-800">
            <div className="p-4">
              <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <Input
                  type="text"
                  label="Search users"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dark:text-white"
                  containerProps={{
                    className: "min-w-[250px]"
                  }}
                  labelProps={{
                    className: "dark:text-gray-400"
                  }}
                />
              </div>

              {/* Users Table */}
              <div style={{ height: 500 }} className="dark:bg-gray-800">
                <DataGrid
                  rows={users.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.roles.length > 0 ? user.roles[0].name : 'No role',
                    created_at: new Date(user.created_at).toLocaleDateString(),
                    last_login: user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'
                  }))}
                  columns={[
                    {
                      field: 'name',
                      headerName: 'Name',
                      flex: 1,
                      renderCell: (params) => (
                        <Typography className="text-gray-900 dark:text-white">
                          {params.value}
                        </Typography>
                      )
                    },
                    {
                      field: 'email',
                      headerName: 'Email',
                      flex: 1,
                      renderCell: (params) => (
                        <Typography className="text-gray-600 dark:text-gray-400">
                          {params.value}
                        </Typography>
                      )
                    },
                    {
                      field: 'role',
                      headerName: 'Role',
                      flex: 1,
                      renderCell: (params) => (
                        <Chip
                          value={params.value.replace(/-/g, ' ')}
                          className="capitalize"
                          color={getRoleColor(params.value)}
                        />
                      )
                    },
                    {
                      field: 'created_at',
                      headerName: 'Created At',
                      flex: 1,
                      renderCell: (params) => (
                        <Typography className="text-gray-600 dark:text-gray-400">
                          {params.value}
                        </Typography>
                      )
                    },
                    {
                      field: 'last_login',
                      headerName: 'Last Login',
                      flex: 1,
                      renderCell: (params) => (
                        <Typography className="text-gray-600 dark:text-gray-400">
                          {params.value}
                        </Typography>
                      )
                    },
                    {
                      field: 'actions',
                      headerName: 'Actions',
                      flex: 1,
                      renderCell: (params) => (
                        <div className="flex gap-2">
                          <Tooltip content="Edit User">
                            <IconButton
                              variant="text"
                              color="blue-gray"
                              onClick={() => handleEditClick(params.row)}
                              className="dark:text-gray-400 hover:dark:text-white"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Delete User">
                            <IconButton
                              variant="text"
                              color="red"
                              onClick={() => handleDeleteClick(params.row)}
                              className="dark:text-red-400 hover:dark:text-red-500"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      )
                    }
                  ]}
                  className="dark:bg-gray-800 dark:text-white"
                  sx={{
                    '& .MuiDataGrid-root': {
                      border: 'none',
                      backgroundColor: 'transparent'
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid rgba(156, 163, 175, 0.2)'
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: 'rgba(156, 163, 175, 0.1)',
                      color: 'inherit'
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: '1px solid rgba(156, 163, 175, 0.2)',
                      backgroundColor: 'transparent'
                    }
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Create User Dialog */}
          <Dialog
            open={showCreateDialog}
            handler={() => setShowCreateDialog(false)}
            className="dark:bg-gray-800"
          >
            <DialogHeader className="dark:text-white">Create New User</DialogHeader>
            <DialogBody className="overflow-y-auto">
              <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                <Input
                  type="text"
                  label="Name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  error={errors.name}
                  className="dark:text-white"
                  labelProps={{
                    className: "dark:text-gray-400"
                  }}
                />
                <Input
                  type="email"
                  label="Email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  error={errors.email}
                  className="dark:text-white"
                  labelProps={{
                    className: "dark:text-gray-400"
                  }}
                />
                <Select
                  label="Role"
                  value={data.role}
                  onChange={(value) => setData('role', value)}
                  error={errors.role}
                  className="dark:text-white"
                  labelProps={{
                    className: "dark:text-gray-400"
                  }}
                >
                  {availableRoles.map((role) => (
                    <Option key={role} value={role} className="dark:text-gray-300">
                      {role.replace(/-/g, ' ')}
                    </Option>
                  ))}
                </Select>
                <Input
                  type="password"
                  label="Password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  error={errors.password}
                  className="dark:text-white"
                  labelProps={{
                    className: "dark:text-gray-400"
                  }}
                />
                <Input
                  type="password"
                  label="Confirm Password"
                  value={data.password_confirmation}
                  onChange={(e) => setData('password_confirmation', e.target.value)}
                  error={errors.password_confirmation}
                  className="dark:text-white"
                  labelProps={{
                    className: "dark:text-gray-400"
                  }}
                />
              </form>
            </DialogBody>
            <DialogFooter className="space-x-2">
              <Button
                variant="outlined"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="dark:text-gray-400 dark:border-gray-400 hover:dark:border-white hover:dark:text-white"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={processing}>
                Create User
              </Button>
            </DialogFooter>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog
            open={showEditDialog}
            handler={() => setShowEditDialog(false)}
            className="dark:bg-gray-800"
          >
            <DialogHeader className="dark:text-white">Edit User</DialogHeader>
            <DialogBody className="overflow-y-auto">
              <form onSubmit={handleUpdateUser} className="flex flex-col gap-4">
                <Input
                  type="text"
                  label="Name"
                  value={editForm.data.name}
                  onChange={(e) => editForm.setData('name', e.target.value)}
                  error={editForm.errors.name}
                  className="dark:text-white"
                  labelProps={{
                    className: "dark:text-gray-400"
                  }}
                />
                <Input
                  type="email"
                  label="Email"
                  value={editForm.data.email}
                  onChange={(e) => editForm.setData('email', e.target.value)}
                  error={editForm.errors.email}
                  className="dark:text-white"
                  labelProps={{
                    className: "dark:text-gray-400"
                  }}
                />
                <Select
                  label="Role"
                  value={editForm.data.role}
                  onChange={(value) => editForm.setData('role', value)}
                  error={editForm.errors.role}
                  className="dark:text-white"
                  labelProps={{
                    className: "dark:text-gray-400"
                  }}
                >
                  {availableRoles.map((role) => (
                    <Option key={role} value={role} className="dark:text-gray-300">
                      {role.replace(/-/g, ' ')}
                    </Option>
                  ))}
                </Select>
              </form>
            </DialogBody>
            <DialogFooter className="space-x-2">
              <Button
                variant="outlined"
                onClick={() => setShowEditDialog(false)}
                className="dark:text-gray-400 dark:border-gray-400 hover:dark:border-white hover:dark:text-white"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={editForm.processing}>
                Update User
              </Button>
            </DialogFooter>
          </Dialog>

          {/* Delete User Dialog */}
          <Dialog
            open={showDeleteDialog}
            handler={() => setShowDeleteDialog(false)}
            className="dark:bg-gray-800"
          >
            <DialogHeader className="dark:text-white">Delete User</DialogHeader>
            <DialogBody className="dark:text-gray-300">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogBody>
            <DialogFooter className="space-x-2">
              <Button
                variant="outlined"
                onClick={() => setShowDeleteDialog(false)}
                className="dark:text-gray-400 dark:border-gray-400 hover:dark:border-white hover:dark:text-white"
              >
                Cancel
              </Button>
              <Button color="red" onClick={handleDeleteUser}>
                Delete User
              </Button>
            </DialogFooter>
          </Dialog>
        </div>
      </div>
    </Authenticated>
  );
} 