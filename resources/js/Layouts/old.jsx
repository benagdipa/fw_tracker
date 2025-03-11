import React, { useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { Button, Card, List, ListItem, ListItemPrefix, Typography } from '@material-tailwind/react';
import { AlignJustifyIcon, ChevronDownIcon, DatabaseZapIcon, FileCog2Icon, FileCogIcon, GaugeCircleIcon, GitCommitVerticalIcon, GlobeIcon, LocateFixedIcon, NfcIcon, Settings2Icon, User2Icon, UserRoundCogIcon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function Authenticated({ user, children }) {
    const { role } = usePage().props?.auth
    const { entities } = usePage().props
    const currentRoute = route().current();
    const [showSidebar, setShowSidebar] = useState(false)

    const handleHamburgerIcon = () => {
        setShowSidebar(!showSidebar)
    }

    return (
        <div className="admin-layout">
            <div className="header w-full py-4 bg-white border-b-2 sticky top-0 z-50">
                <div className="full flex items-center justify-between px-6">
                    <div className="left">
                        <div className='flex items-center gap-4'>
                            <div className="ham flex items-center">
                                <button onClick={handleHamburgerIcon}><AlignJustifyIcon size={24} color='gray' strokeWidth={1.5} /></button>
                            </div>
                            <Typography variant="h5" color="blue-gray" className='text-center'>
                                FWP Tracker
                            </Typography>
                        </div>
                    </div>
                    <div className="right">
                        <div className="flex items-center gap-4">
                            {currentRoute !== 'table.wizard.index' && (
                                <Link href={route('table.wizard.index')}>
                                    <Button variant='gradient' size='sm' className='capitalize rounded text-sm'>
                                        Create Table
                                    </Button>
                                </Link>
                            )}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-md">
                                          <div className="border rounded-full w-10 h-10 bg-[#F4F7F9] flex items-center justify-center">
                                                        <User2Icon color='rgba(61, 67, 74, 0.9)' size={18} strokeWidth={1.5} />
                                                    </div>
                                    <button type="button" className="text-xs sm:text-base flex items-center gap-2 text-gray-600 font-semibold">{user?.name}<ChevronDownIcon /></button>
                                    </span>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>
            <div className="page-content">
                <aside className={`fixed w-full max-w-[15rem] transition-all ease-in-out duration-300 z-50 ${showSidebar ? "left-0" : "-left-full"}`}>
                    <Card className="h-screen bg-gradient-to-tr from-gray-900 to-gray-800 rounded-none">
                        <List className='text-white'>
                            <Link href='/dashboard' className={`${currentRoute === "dashboard" ? "bg-blue-gray-50/50 rounded-lg" : ""}`}>
                                <ListItem>
                                    <ListItemPrefix className='mr-3'><GaugeCircleIcon size={20} /></ListItemPrefix>
                                    <span className='font-semibold text-sm'>Dashboard</span>
                                </ListItem>
                            </Link>
                            <Link href={route('wireless.sites.index')} className={`${currentRoute === "wireless.sites.index" ? "bg-blue-gray-50/50 rounded-lg" : ""}`}>
                                <ListItem>
                                    <ListItemPrefix className='mr-3'><GlobeIcon size={20} /></ListItemPrefix>
                                    <span className='font-semibold text-base'>WNTD</span>
                                </ListItem>
                            </Link>
                            <Link href={route('site.field.name.index')} className={`${currentRoute === "site.field.name.index" ? "bg-blue-gray-50/50 rounded-lg" : ""}`}>
                                <ListItem>
                                    <ListItemPrefix className='mr-3'><NfcIcon size={20} /></ListItemPrefix>
                                    <span className='font-semibold text-base'>FW Site</span>
                                </ListItem>
                            </Link>
                            {entities?.length > 0 && entities?.map((item, index) => (
                                <React.Fragment key={index}>
                                    <Link href={route('view.table.item', item?.slug)}>
                                        <ListItem>
                                            <ListItemPrefix className='mr-3'><GitCommitVerticalIcon size={20} /></ListItemPrefix>
                                            <span className='font-semibold text-sm'>{item?.title}</span>
                                        </ListItem>
                                    </Link>
                                </React.Fragment>
                            ))}
                            {role === 'super-admin' && (
                                <>
                                    <Link href={route('sql.import')} className={`${currentRoute === "sql.import" ? "bg-blue-gray-50/50 rounded-lg" : ""}`}>
                                        <ListItem>
                                            <ListItemPrefix className='mr-3'><DatabaseZapIcon size={20} /></ListItemPrefix>
                                            <span className='font-semibold text-sm'>SQL Import</span>
                                        </ListItem>
                                    </Link>
                                    <Link href={route('mo.file.generator')} className={`${currentRoute === "mo.file.generator" ? "bg-blue-gray-50/50 rounded-lg" : ""}`}>
                                        <ListItem>
                                            <ListItemPrefix className='mr-3'><FileCog2Icon size={20} /></ListItemPrefix>
                                            <span className='font-semibold text-sm'>MO File Generator</span>
                                        </ListItem>
                                    </Link>
                                    <Link href={route('roles.index')} className={`${currentRoute === "roles.index" ? "bg-blue-gray-50/50 rounded-lg" : ""}`}>
                                        <ListItem>
                                            <ListItemPrefix className='mr-3'><UserRoundCogIcon size={20} /></ListItemPrefix>
                                            <span className='font-semibold text-sm'>Roles Management</span>
                                        </ListItem>
                                    </Link>
                                    <Link href={route('settings.index')} className={`${currentRoute === "settings.index" ? "bg-blue-gray-50/50 rounded-lg" : ""}`}>
                                        <ListItem>
                                            <ListItemPrefix className='mr-3'><Settings2Icon size={20} /></ListItemPrefix>
                                            <span className='font-semibold text-sm'>Settings</span>
                                        </ListItem>
                                    </Link>
                                </>
                            )}
                        </List>
                    </Card>
                </aside>
                <main className='main-content lg:w-full lg:max-w-[calc(100%)]'>{children}</main>
            </div>
            <Toaster position="top-right" />
        </div>
    );
}
