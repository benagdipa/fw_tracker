import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    Card, 
    CardBody, 
    CardHeader, 
    Typography, 
    Button, 
    Tabs, 
    TabsHeader, 
    TabsBody, 
    Tab, 
    TabPanel,
    Avatar,
    Chip 
} from '@material-tailwind/react';
import { UserIcon, Cog6ToothIcon, ShieldCheckIcon, BellIcon } from '@heroicons/react/24/outline';

export default function Edit({ auth, mustVerifyEmail, status }) {
    const [activeTab, setActiveTab] = useState("profile");
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    // Get user role for display
    const userRole = auth.user.role || 'user';
    
    // Get role color
    const getRoleColor = (role) => {
        const roleColors = {
            'super-admin': 'red',
            'admin': 'blue',
            'editor': 'green',
            'user': 'gray'
        };
        
        return roleColors[role.toLowerCase()] || 'gray';
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="My Profile" />

            <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Profile Header */}
                    <Card className="mb-8 overflow-hidden border-0 shadow-md">
                        <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 relative">
                            {/* Cover photo decoration element */}
                            <div className="absolute right-5 bottom-5">
                                <div className="w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                            </div>
                            <div className="absolute left-10 top-10">
                                <div className="w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
                            </div>
                        </div>
                        
                        <CardBody className="px-6 pb-6 -mt-16 relative z-10">
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                <div className="relative">
                                    {auth.user.profile_photo ? (
                                        <Avatar
                                            size="xxl"
                                            variant="circular"
                                            alt={auth.user.name}
                                            src={auth.user.profile_photo}
                                            className="border-4 border-white dark:border-gray-800 shadow-lg h-32 w-32 object-cover"
                                        />
                                    ) : (
                                        <div className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <UserIcon className="h-20 w-20 text-gray-500" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4 md:mt-0">
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                                        <Typography variant="h3" color="blue-gray" className="font-bold">
                                            {auth.user.name}
                                        </Typography>
                                        <Chip 
                                            value={userRole.replace(/-/g, ' ')}
                                            className="capitalize normal-case"
                                            size="sm"
                                            color={getRoleColor(userRole)}
                                        />
                                    </div>
                                    <Typography color="gray" className="mt-1">
                                        {auth.user.email}
                                    </Typography>
                                    <Typography color="gray" className="text-sm mt-2">
                                        Member since {new Date(auth.user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Tabs and Forms */}
                    <Card className="overflow-hidden shadow-md">
                        <CardBody className="px-0 pt-0">
                            <Tabs value={activeTab} onChange={(value) => setActiveTab(String(value))}>
                                <TabsHeader className="bg-transparent">
                                    <Tab value="profile" className="py-4">
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="h-4 w-4" />
                                            Profile Information
                                        </div>
                                    </Tab>
                                    <Tab value="security" className="py-4">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheckIcon className="h-4 w-4" />
                                            Security Settings
                                        </div>
                                    </Tab>
                                    <Tab value="account" className="py-4">
                                        <div className="flex items-center gap-2">
                                            <Cog6ToothIcon className="h-4 w-4" />
                                            Account Management
                                        </div>
                                    </Tab>
                                </TabsHeader>

                                <TabsBody animate={{ initial: { opacity: 0 }, mount: { opacity: 1 }, unmount: { opacity: 0 } }}>
                                    <TabPanel value="profile" className="p-0">
                                        <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-lg">
                                            <UpdateProfileInformationForm
                                                mustVerifyEmail={mustVerifyEmail}
                                                status={status}
                                                className="max-w-3xl"
                                            />
                                        </div>
                                    </TabPanel>
                                    
                                    <TabPanel value="security" className="p-0">
                                        <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-lg">
                                            <UpdatePasswordForm className="max-w-3xl" />
                                        </div>
                                    </TabPanel>
                                    
                                    <TabPanel value="account" className="p-0">
                                        <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-lg">
                                            <DeleteUserForm className="max-w-3xl" />
                                        </div>
                                    </TabPanel>
                                </TabsBody>
                            </Tabs>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
