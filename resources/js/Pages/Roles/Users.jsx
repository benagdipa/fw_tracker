import React, { useState } from 'react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    Card, 
    CardHeader,
    CardBody,
    Typography, 
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    IconButton,
    Tooltip,
    Chip,
    Input,
    Select,
    Option
} from '@material-tailwind/react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PencilIcon, TrashIcon, UserPlusIcon, UsersIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import '../../css/data-grid-custom.css';

export default function Users({ auth, users, availableRoles }) {
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        roles: [],
    });
    const { delete: destroy } = useForm();

    // Theme for Material UI DataGrid
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

    const getRoleChipColor = (roleName) => {
        const roleLower = roleName.toLowerCase();
        if (roleLower.includes('super') || roleLower === 'super-admin') {
            return 'red';
        } else if (roleLower.includes('admin')) {
            return 'blue';
        } else if (roleLower.includes('editor')) {
            return 'green';
        } else {
            return 'gray';
        }
    };

    // Define columns for DataGrid
    const columns = [
        { 
            field: 'id', 
            headerName: 'ID', 
            width: 70 
        },
        { 
            field: 'name', 
            headerName: 'User Name', 
            width: 200,
            renderCell: (params) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        {params.row.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{params.value}</span>
                </div>
            ),
        },
        { 
            field: 'email', 
            headerName: 'Email', 
            width: 250 
        },
        {
            field: 'roles',
            headerName: 'Roles',
            width: 250,
            renderCell: (params) => (
                <div className="flex flex-wrap gap-1">
                    {params.value.length > 0 ? (
                        params.value.map((role, index) => (
                            <Chip
                                key={index}
                                size="sm"
                                variant="ghost"
                                color={getRoleChipColor(role.name)}
                                value={role.name}
                                className="capitalize"
                            />
                        ))
                    ) : (
                        <Chip
                            size="sm"
                            variant="outlined"
                            color="gray"
                            value="No Role"
                        />
                    )}
                </div>
            ),
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            width: 180,
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
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <div className="flex gap-2">
                    <Tooltip content="Edit User">
                        <IconButton
                            variant="text"
                            color="blue"
                            className="p-2 bg-blue-50 hover:bg-blue-100"
                            onClick={() => handleEdit(params.row)}
                        >
                            <PencilIcon className="h-4 w-4" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip content="Delete User">
                        <IconButton 
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-500" 
                            variant="text"
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${params.row.name}? This action cannot be undone.`)) {
                                    destroy(route('roles.users.destroy', params.row.id));
                                }
                            }}
                        >
                            <TrashIcon className="h-4 w-4" />
                        </IconButton>
                    </Tooltip>
                </div>
            ),
        },
    ];

    const handleEdit = (user) => {
        setSelectedUser(user);
        setData({
            name: user.name,
            email: user.email,
            roles: user.roles.map(role => role.id.toString()),
        });
        setIsEditModalOpen(true);
    };

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.roles.some(role => role.name.toLowerCase().includes(search.toLowerCase()))
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('roles.users.update', selectedUser.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
            },
        });
    };

    return (
        <Authenticated user={auth?.user}>
            <Head title='Users Management' />
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
                                <div className="flex items-center gap-3 mb-1">
                                    <Link href={route('roles.index')}>
                                        <IconButton variant="text" color="blue" size="sm">
                                            <ArrowLeftIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Link>
                                    <Typography variant="h4" color="blue-gray" className="font-bold flex items-center gap-2">
                                        <UsersIcon className="h-6 w-6 text-blue-600" /> User Management
                                    </Typography>
                                </div>
                                <Typography color="gray" className="text-sm font-normal">
                                    Manage user accounts and their assigned roles
                                </Typography>
                            </div>
                            <Link href={route('roles.users.create')}>
                                <Button
                                    size="md"
                                    color="blue"
                                    className="flex items-center gap-2"
                                >
                                    <UserPlusIcon className="h-4 w-4" /> Add New User
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardBody className="px-6 pb-6 pt-2">
                        <div className="w-full mb-5">
                            <Input
                                type="text"
                                label="Search users by name, email or role"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                                icon={<UsersIcon className="h-4 w-4" />}
                                containerProps={{
                                    className: "min-w-[240px]",
                                }}
                            />
                        </div>

                        <div style={{ height: 500, width: '100%' }}>
                            <ThemeProvider theme={theme}>
                                <DataGrid
                                    rows={filteredUsers}
                                    columns={columns}
                                    initialState={{
                                        pagination: {
                                            paginationModel: { pageSize: 10, page: 0 },
                                        },
                                    }}
                                    pageSizeOptions={[5, 10, 25, 50]}
                                    autoHeight
                                    disableRowSelectionOnClick
                                    pagination
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

                {/* Edit User Modal */}
                <Dialog size="sm" open={isEditModalOpen} handler={() => setIsEditModalOpen(false)}>
                    <DialogHeader className="border-b pb-3">Edit User</DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <DialogBody className="py-6">
                            <div className="space-y-4">
                                <div>
                                    <Typography variant="small" color="blue-gray" className="font-medium mb-1">
                                        Full Name
                                    </Typography>
                                    <Input
                                        size="lg"
                                        placeholder="Enter user's full name"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        error={errors.name ? true : false}
                                    />
                                    {errors.name && (
                                        <Typography variant="small" color="red" className="mt-1">
                                            {errors.name}
                                        </Typography>
                                    )}
                                </div>
                                
                                <div>
                                    <Typography variant="small" color="blue-gray" className="font-medium mb-1">
                                        Email Address
                                    </Typography>
                                    <Input
                                        type="email"
                                        size="lg"
                                        placeholder="Enter email address"
                                        value={data.email}
                                        onChange={(e) => setData("email", e.target.value)}
                                        error={errors.email ? true : false}
                                    />
                                    {errors.email && (
                                        <Typography variant="small" color="red" className="mt-1">
                                            {errors.email}
                                        </Typography>
                                    )}
                                </div>
                                
                                <div>
                                    <Typography variant="small" color="blue-gray" className="font-medium mb-1">
                                        Roles
                                    </Typography>
                                    <Select
                                        label="Select Roles"
                                        value={data.roles.length > 0 ? data.roles[0] : ""}
                                        onChange={(value) => {
                                            const newRoles = data.roles.includes(value)
                                                ? data.roles.filter(r => r !== value)
                                                : [...data.roles, value];
                                            setData("roles", newRoles);
                                        }}
                                        size="lg"
                                        error={errors.roles ? true : false}
                                        selected={(element) => 
                                            element && 
                                            React.cloneElement(element, {
                                                disabled: true,
                                                className: "flex items-center opacity-100 px-0 gap-2 pointer-events-none",
                                            })
                                        }
                                    >
                                        {availableRoles && availableRoles.map(role => (
                                            <Option 
                                                key={role.id} 
                                                value={role.id.toString()}
                                                className={data.roles.includes(role.id.toString()) ? "bg-blue-50" : ""}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {data.roles.includes(role.id.toString()) && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-500">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                    )}
                                                    {role.name}
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                    {data.roles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {data.roles.map(roleId => {
                                                const role = availableRoles.find(r => r.id.toString() === roleId);
                                                return role ? (
                                                    <Chip
                                                        key={roleId}
                                                        value={role.name}
                                                        variant="ghost"
                                                        color={getRoleChipColor(role.name)}
                                                        dismissible={{
                                                            onClose: () => {
                                                                setData("roles", data.roles.filter(r => r !== roleId));
                                                            },
                                                        }}
                                                    />
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                    {errors.roles && (
                                        <Typography variant="small" color="red" className="mt-1">
                                            {errors.roles}
                                        </Typography>
                                    )}
                                </div>
                            </div>
                        </DialogBody>
                        <DialogFooter className="border-t pt-3">
                            <Button
                                variant="outlined"
                                color="red"
                                onClick={() => setIsEditModalOpen(false)}
                                className="mr-2"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color="blue"
                                disabled={processing}
                            >
                                {processing ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Dialog>
            </div>
        </Authenticated>
    );
}
