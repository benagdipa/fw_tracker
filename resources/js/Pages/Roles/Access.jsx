import React from 'react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Typography, Button, Checkbox } from '@material-tailwind/react';

export default function Access({ auth, routes = [], roles, routeRoles }) {
    const { data, setData, post, errors } = useForm({
        routeRoles: routeRoles || {},  // Initialize with the passed routeRoles
    });

    // Handle role changes for a specific route
    const handleRoleChange = (routeKey, roleName) => {
        const newRouteRoles = { ...data.routeRoles };

        if (newRouteRoles[routeKey]?.roles?.includes(roleName)) {
            // Remove the role
            newRouteRoles[routeKey].roles = newRouteRoles[routeKey].roles.filter(role => role !== roleName);
        } else {
            // Add the role
            newRouteRoles[routeKey].roles = [...(newRouteRoles[routeKey].roles || []), roleName];
        }

        // Update state with new roles
        setData({ ...data, routeRoles: newRouteRoles });
    };

    const handleSubmit = (e) => {
        // Alert the data being submitted
        //alert(JSON.stringify(data.routeRoles, null, 2));
        e.preventDefault();
        post(route('roles.updateAccess'));  // Send the updated routeRoles to the backend
    };

    return (
        <Authenticated user={auth?.user}>
            <Head title='Role Access Management' />
            <div className="top-section p-4">
                <div className="bg-white shadow rounded py-3 px-5 flex justify-between items-center">
                    <Typography variant={'h3'} className='tracking-tight text-primary'>Role Access Management</Typography>
                    <Link href={route('roles.index')}>
                        <Button className="button-primary">Back to Roles</Button>
                    </Link>
                </div>
            </div>
            <div className="content mt-6">
                <Card className="h-full w-full rounded-none p-6">
                    <form onSubmit={handleSubmit}>
                        <table className="w-full table-auto">
                            <thead>
                                <tr>
                                    <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 border-l">Route</th>
                                    <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 border-l">Method</th>
                                    <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 border-l">Roles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(routes) && routes.map((route, index) => {
                                    const routeKey = `${route.uri}|${route.methods[0].toLowerCase()}`;
                                    return (
                                        <tr key={index} className="even:bg-blue-gray-50/50">
                                            <td className="border-l h-10 text-[12px] font-medium ps-2">{route.uri}</td>
                                            <td className="border-l h-10 text-[12px] font-medium ps-2">{route.methods.join(', ')}</td>
                                            <td className="border-l h-10 text-[12px] font-medium ps-2">
                                                {/* Loop through roles and check the associated roles for each route */}
                                                {roles.map((role) => (
                                                    <Checkbox
                                                        key={role.id}
                                                        label={role.name}
                                                        checked={data.routeRoles[routeKey]?.roles?.includes(role.name) || false}  // Check if the role is assigned to the route
                                                        onChange={() => handleRoleChange(routeKey, role.name)}  // Handle checkbox change
                                                        className="text-primary"
                                                    />
                                                ))}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <Button type="submit" className="button-primary mt-4">Update Access</Button>
                    </form>
                </Card>
            </div>
        </Authenticated>
    );
}