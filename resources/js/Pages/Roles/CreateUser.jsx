import React, { useState } from 'react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Typography, Button, Input, Checkbox } from '@material-tailwind/react';

export default function CreateUser({ auth, roles }) {
    const { data, setData, post, errors } = useForm({
        name: '',
        email: '',
        password: '',
        roles: []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('roles.users.store'));
    };

    const handleRoleChange = (roleId) => {
        setData('roles', data.roles.includes(roleId) ? data.roles.filter(id => id !== roleId) : [...data.roles, roleId]);
    };

    return (
        <Authenticated user={auth?.user}>
            <Head title='Create User' />
            <div className="top-section p-4">
                <div className="bg-white shadow rounded py-3 px-5 flex justify-between items-center">
                    <Typography variant={'h3'} className='tracking-tight text-primary'>Create User</Typography>
                    <Link href={route('roles.users.view')}>
                        <Button className="button-primary">Back to Users</Button>
                    </Link>
                </div>
            </div>
            <div className="content mt-6">
                <Card className="h-full w-full rounded-none p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <Input
                                type="text"
                                label="Name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                required
                            />
                            {errors.name && <Typography color="red">{errors.name}</Typography>}
                        </div>
                        <div className="mb-4">
                            <Input
                                type="email"
                                label="Email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                required
                            />
                            {errors.email && <Typography color="red">{errors.email}</Typography>}
                        </div>
                        <div className="mb-4">
                            <Input
                                type="password"
                                label="Password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                                required
                            />
                            {errors.password && <Typography color="red">{errors.password}</Typography>}
                        </div>
                        <div className="mb-4">
                            <Typography variant="h6" className="text-primary">Roles</Typography>
                            {roles.map(role => (
                                <Checkbox
                                    key={role.id}
                                    label={role.name}
                                    checked={data.roles.includes(role.id)}
                                    onChange={() => handleRoleChange(role.id)}
                                    className="text-primary"
                                />
                            ))}
                            {errors.roles && <Typography color="red">{errors.roles}</Typography>}
                        </div>
                        <Button type="submit" className="button-primary">Create User</Button>
                    </form>
                </Card>
            </div>
        </Authenticated>
    );
}