import React, { useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { Button, Card, List, ListItem, ListItemPrefix, Typography } from '@material-tailwind/react';
import {  AlignLeftIcon, BarChart3Icon, BellIcon, MoonIcon, SearchIcon, SettingsIcon, UploadIcon, XIcon ,AlignJustifyIcon, ChevronDownIcon, DatabaseZapIcon, FileCog2Icon, FileCogIcon, GaugeCircleIcon, GitCommitVerticalIcon, GlobeIcon, LocateFixedIcon, NfcIcon, Settings2Icon, User2Icon, UserRoundCogIcon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function Authenticated({ user, children }) {
    const { role } = usePage().props?.auth
    const { entities } = usePage().props
    const currentRoute = route().current();
    const [showSidebar, setShowSidebar] = useState(false)

    const handleHamburgerIcon = () => {
        setShowSidebar(!showSidebar)
    }
    const handleMenuMinimize = () => {
        dispatch(setMinimized(!minimizedSidebar))
    }
    let minimizedSidebar='';
    return (
        <div className="bg-[#f7f9fb] min-h-screen">
        <div className="main-layout">
            <div className="layout-wrapper flex flex-wrap">
                <div className={`sidebar h-screen bg-gray-900 w-full shadow-sm rounded-none overflow-hidden ${minimizedSidebar ? "w-max sm:w-full left-0 sm:max-w-[64px]" : "w-max sm:w-full -left-full sm:max-w-[250px]"} transition-all ease-in-out duration-300 fixed sm:left-0 z-50`}>
                    <div className="close sm:hidden rounded-full block w-max top-2 right-2 absolute p-1 " onClick={handleMenuMinimize}>
                        <XIcon size={22} color="white" />
                    </div>
                    <div className="logo-wrapper py-3">
                        <Link href="/projects" className='flex items-center'>
                            <ApplicationLogo className="size-16" />
                            <h2 className='text-white font-bold text-xl'>Application</h2>
                        </Link>
                    </div>
                    <div className="side-menu py-4">
                        <List className='p-0 rounded-none'>
                            <Link href={route('projects')} >
                                <ListItem className={`py-3 rounded-none text-[#c3c3c3] ${["projects", "projects.show"].includes(currentRoute) ? "border-l-4 border-green-700 text-white bg-gray-700/90" : ""}`}>
                                    <ListItemPrefix className='mr-3'>
                                        <UploadIcon size={22} />
                                    </ListItemPrefix>
                                    <Typography variant='small' className={`font-semibold ${minimizedSidebar ? "sm:hidden" : "block"}`}>Projects</Typography>
                                </ListItem>
                            </Link>
                        </List>
                        <List className='p-0' data-voyager="report-menu">
                            <Link href={route('reports')}>
                                <ListItem className={`py-3 rounded-none text-[#c3c3c3] ${["reports", "reports.new", "reports.store", "reports.show", "reports.edit"].includes(currentRoute) ? "border-l-4 border-green-700 text-white bg-gray-700/90" : ""}`}>
                                    <ListItemPrefix className='mr-3'>
                                        <BarChart3Icon size={22} />
                                    </ListItemPrefix>
                                    <Typography variant='small' className={`font-semibold  ${minimizedSidebar ? "sm:hidden" : "block"}`}>Reports</Typography>
                                </ListItem>
                            </Link>
                        </List>
                        <List className='p-0'>
                            <Link href={route('roles.permissions.index')}>
                                <ListItem className={`py-3 rounded-none text-[#c3c3c3] ${['roles.permissions.index'].includes(currentRoute) ? "border-l-4 border-green-700 text-white bg-gray-700/90" : ""}`}>
                                    <ListItemPrefix className='mr-3'>
                                        <UserRoundCogIcon size={22} />
                                    </ListItemPrefix>
                                    <Typography variant='small' className={`font-semibold  ${minimizedSidebar ? "sm:hidden" : "block"}`}>Roles & Permissions</Typography>
                                </ListItem>
                            </Link>
                        </List>
                        <List className='p-0'>
                            <Link href={route('roles.permissions.index')}>
                                <ListItem className={`py-3 rounded-none text-[#c3c3c3]`}>
                                    <ListItemPrefix className='mr-3'>
                                        <SettingsIcon size={22} />
                                    </ListItemPrefix>
                                    <Typography variant='small' className={`font-semibold  ${minimizedSidebar ? "sm:hidden" : "block"}`}>Settings</Typography>
                                </ListItem>
                            </Link>
                        </List>
                    </div>
                </div>
                <div className={`main-content w-full ${minimizedSidebar ? "w-full sm:max-w-[calc(100%-64px)] sm:ms-[64px]" : "sm:max-w-[calc(100%-250px)] sm:ms-[250px]"} transition-all ease-in-out duration-300`}>
                    <header className='bg-white p-3 shadow border-b sticky top-0 z-50'>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="toggle-menu cursor-pointer">
                                    <AlignLeftIcon onClick={handleMenuMinimize} size={28} strokeWidth={1.5} color='rgba(61, 67, 74, 0.9)' />
                                </div>
                                <div className="search-item relative">
                                    <input type="text" placeholder="Search..." className="min-w-40 sm:min-w-80 w-full border-gray-300 rounded text-sm" />
                                    <span className='absolute top-[6px] right-2'><SearchIcon color='rgba(61, 67, 74, 0.9)' strokeWidth={1.5} /></span>
                                </div>
                            </div>
                            <div className="right-item flex items-center justify-center gap-4 ">
                                <div className="theme-change hidden sm:block cursor-pointer">
                                    <div className="border rounded-full w-10 h-10 bg-[#F4F7F9] flex items-center justify-center">
                                        <MoonIcon color='rgba(61, 67, 74, 0.9)' size={18} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="notification hidden sm:block cursor-pointer">
                                    <div className="border rounded-full w-10 h-10 bg-[#F4F7F9] flex items-center justify-center">
                                        <BellIcon color='rgba(61, 67, 74, 0.9)' size={18} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="user-item font-normal">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className='flex items-center gap-2'>
                                                <div className="border rounded-full w-10 h-10 bg-[#F4F7F9] flex items-center justify-center">
                                                    <User2Icon color='rgba(61, 67, 74, 0.9)' size={18} strokeWidth={1.5} />
                                                </div>
                                                <button type="button" className="text-xs sm:text-base flex items-center gap-2 text-gray-600 font-semibold">{user?.name}<ChevronDownIcon /></button>
                                            </span>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content>
                                            <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                            <Dropdown.Link onClick={()=>{localStorage.removeItem('minimized')}} href={route('logout')} method="post" as="button">
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>
                    </header>
                    <div className="content">
                        {children}
                    </div>
                </div>
            </div>
        </div>
        <Toaster position='top-right' />
    </div>
    );
}
