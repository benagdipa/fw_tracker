import React, { useState, useEffect } from 'react';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage, Head } from '@inertiajs/react';
import { Button, Card, List, ListItem, ListItemPrefix, Typography } from '@material-tailwind/react';
import { 
    AlignLeftIcon, 
    BarChart3Icon, 
    BellIcon, 
    MoonIcon, 
    SearchIcon, 
    SettingsIcon, 
    UploadIcon, 
    XIcon, 
    AlignJustifyIcon, 
    ChevronDownIcon, 
    DatabaseZapIcon, 
    FileCog2Icon, 
    FileCogIcon, 
    GaugeCircleIcon, 
    GitCommitVerticalIcon, 
    GlobeIcon, 
    LocateFixedIcon, 
    NfcIcon, 
    Settings2Icon, 
    User2Icon, 
    UserRoundCogIcon,
    HomeIcon,
    SignalIcon,
    Building2Icon,
    MapPinIcon,
    WifiIcon,
    WrenchIcon
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { setOpenCloseMenu } from '@/Store/Reducers/MenuSlice';
import { useDispatch, useSelector } from 'react-redux';
import ApplicationLogo from '@/Components/ApplicationLogo';
import PageTransition from '@/Components/PageTransition';
import SafeNavLink from '@/Components/SafeNavLink';
import NavLink from '@/Components/NavLink';
import { FiDatabase } from 'react-icons/fi';
import { 
    HomeIcon as HeroHomeIcon, 
    UserIcon, 
    Cog6ToothIcon, 
    BuildingLibraryIcon, 
    BuildingOffice2Icon, 
    ArrowRightOnRectangleIcon, 
    WifiIcon as HeroWifiIcon, 
    MapPinIcon as HeroMapPinIcon, 
    TableCellsIcon,
    SignalIcon as HeroSignalIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/Context/ThemeContext';

export default function Authenticated({ user, children }) {
    const dispatch = useDispatch();
    const { minimizedSidebar } = useSelector((state) => state.menu)
    const { role } = usePage().props?.auth
    const { entities } = usePage().props
    const currentRoute = route().current();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const { darkMode, toggleDarkMode } = useTheme();
    const [searchOpen, setSearchOpen] = useState(false);
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768 && !minimizedSidebar) {
                dispatch(setOpenCloseMenu());
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [minimizedSidebar, dispatch]);
    
    const handleHamburgerIcon = () => {
        dispatch(setOpenCloseMenu());
    }
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            const sidebar = document.querySelector('.sidebar');
            const hamburger = document.querySelector('.hamburger');
            
            if (isMobile && !minimizedSidebar && sidebar && hamburger) {
                if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
                    dispatch(setOpenCloseMenu());
                }
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobile, minimizedSidebar, dispatch]);

    const toggleSearch = () => {
        setSearchOpen(!searchOpen);
    };
    
    return (
        <div className={`${darkMode ? 'dark bg-gray-900 text-white' : 'bg-[#f7f9fb]'} min-h-screen transition-colors duration-300`}>
            {/* Global Font Fix */}
            <Head>
                {/* Use only native system fonts - no external font loading */}
                <style type="text/css">
                    {`
                        /* Use only system fonts to avoid loading issues */
                        body, button, input, select, textarea {
                            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                        }
                    `}
                </style>
            </Head>

            <Toaster position="top-right" />

            <div className="main-layout">
                <div className="layout-wrapper flex flex-wrap">
                    <div className={`sidebar h-screen ${darkMode ? 'bg-gray-800 text-white' : 'bg-white shadow-lg'} overflow-hidden ${minimizedSidebar ? "w-max sm:w-full sm:left-[-100px] sm:max-w-[64px]" : "w-max sm:w-full -left-full sm:max-w-[250px]"} transition-all ease-in-out duration-300 fixed sm:left-0 z-50 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="close sm:hidden rounded-full hover:bg-gray-800 hover:text-white block w-max top-4 right-4 absolute p-1 cursor-pointer transition-colors" onClick={handleHamburgerIcon}>
                            <XIcon size={22} className={darkMode ? "text-white" : "text-gray-700"} />
                        </div>
                        <div className={`logo-wrapper p-4 px-8 my-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <Link href={route('dashboard')} className='flex items-center'>
                                <ApplicationLogo className={`w-40 ${darkMode ? 'filter brightness-150' : ''}`} />
                            </Link>
                        </div>
                        <div className="side-menu px-4 py-2">
                            <div className="menu-category text-xs uppercase font-semibold mb-3 pl-3 opacity-60">
                                Main Navigation
                            </div>
                            <NavLink
                                href={route("dashboard")}
                                active={route().current("dashboard")}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                            >
                                <HomeIcon className="h-5 w-5" />
                                <span>Dashboard</span>
                            </NavLink>

                            <div className="menu-category text-xs uppercase font-semibold mt-6 mb-3 pl-3 opacity-60">
                                Network Modules
                            </div>
                            
                            <div className="space-y-1">
                                <NavLink
                                    href={route("wntd.field.name.index")}
                                    active={route().current("wntd.field.name.index") || route().current("wntd.field.name.show")}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                                >
                                    <WifiIcon className="h-5 w-5" />
                                    <span>WNTD</span>
                                </NavLink>

                                <NavLink
                                    href={route("implementation.field.name.index")}
                                    active={route().current("implementation.field.name.index") || route().current("implementation.field.name.show")}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                                >
                                    <MapPinIcon className="h-5 w-5" />
                                    <span>Implementation Tracker</span>
                                </NavLink>

                                <NavLink
                                    href={route("ran.configuration.index")}
                                    active={route().current("ran.configuration.index")}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                                >
                                    <HeroSignalIcon className="h-5 w-5" />
                                    <span>RAN Configuration</span>
                                </NavLink>
                            </div>

                            <div className="menu-category text-xs uppercase font-semibold mt-6 mb-3 pl-3 opacity-60">
                                Tools & Utilities
                            </div>
                            
                            <div className="space-y-1">
                                <NavLink
                                    href={route("settings.index")}
                                    active={route().current("settings.index") || route().current("sql.import")}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                                >
                                    <DatabaseZapIcon className="h-5 w-5" />
                                    <span>SQL Explorer</span>
                                </NavLink>

                                <NavLink
                                    href={route("tools.manager")}
                                    active={route().current("tools.manager")}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                                >
                                    <WrenchIcon className="h-5 w-5" />
                                    <span>Tools Manager</span>
                                </NavLink>
                            </div>

                            {role === "super-admin" && (
                                <>
                                    <div className="menu-category text-xs uppercase font-semibold mt-6 mb-3 pl-3 opacity-60">
                                        Administration
                                    </div>
                                    <div className="space-y-1">
                                        <NavLink
                                            href={route("admin.index")}
                                            active={route().current("admin.index")}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 bg-red-50 dark:bg-red-900/20"
                                        >
                                            <SettingsIcon className="h-5 w-5 text-red-500" />
                                            <span className="font-medium text-red-800 dark:text-red-300">Admin Dashboard</span>
                                        </NavLink>
                                        
                                        <NavLink
                                            href={route("roles.users.view")}
                                            active={route().current("roles.users.view") || route().current("roles.index")}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 bg-red-50 dark:bg-red-900/20"
                                        >
                                            <User2Icon className="h-5 w-5 text-red-500" />
                                            <span className="font-medium text-red-800 dark:text-red-300">User Management</span>
                                        </NavLink>
                                    </div>
                                </>
                            )}
                                
                            <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>
                                
                            <NavLink
                                href={route("profile.edit")}
                                active={route().current("profile.edit")}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                            >
                                <UserRoundCogIcon className="h-5 w-5" />
                                <span>My Profile</span>
                            </NavLink>
                        </div>
                    </div>
                    <div className={`content w-full sm:w-[calc(100%-250px)] ${minimizedSidebar ? "sm:w-[calc(100%-64px)]" : ""} h-screen transition-all ease-in-out duration-300 sm:ml-auto`}>
                        <div className={`navbar sticky top-0 z-40 ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between transition-colors duration-300`}>
                            <div className="navbar-left flex items-center">
                                <div className="hamburger sm:block hidden rounded-lg p-1.5 cursor-pointer mr-2 hover:bg-gray-100 hover:dark:bg-gray-700 transition-colors" onClick={handleHamburgerIcon}>
                                    <AlignJustifyIcon size={20} className={darkMode ? "text-white" : "text-gray-600"} />
                                </div>
                                
                                {/* Search button */}
                                <Button
                                    variant="text"
                                    size="sm"
                                    className="hidden sm:flex items-center gap-2 text-gray-500"
                                    onClick={toggleSearch}
                                >
                                    <SearchIcon size={18} />
                                    <span className="text-sm font-normal">Search...</span>
                                </Button>
                            </div>
                            <div className="navbar-right flex items-center gap-2">
                                {/* Dark mode toggle */}
                                <Button
                                    variant="text"
                                    size="sm"
                                    className="rounded-full p-2"
                                    onClick={toggleDarkMode}
                                >
                                    <MoonIcon size={18} className={darkMode ? "text-white" : "text-gray-600"} />
                                </Button>

                                {/* User dropdown */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <Button
                                            variant="text"
                                            size="sm"
                                            className="flex items-center gap-2 rounded-full"
                                        >
                                            <User2Icon size={18} className={darkMode ? "text-white" : "text-gray-600"} />
                                        </Button>
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
                        <main className="main-content">
                            <PageTransition>{children}</PageTransition>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
