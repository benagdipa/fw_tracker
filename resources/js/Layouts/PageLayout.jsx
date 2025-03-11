import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { Typography } from '@material-tailwind/react';
import React,{useState} from 'react'
import { FaBars } from 'react-icons/fa';


export default function PageLayout({ children }) {
    const { auth } = usePage().props
    const d = new Date();
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };
    return (
        <div className="site-content">
            <header className='border-b py-4 shadow-sm'>
                <div className="container mx-auto w-10/12 md:w-full flex items-center justify-between">
                    <div className="left">
                        <Link href="/">
                            <ApplicationLogo className="font-semibold text-3xl tracking-tight  text-blue-gray-600" />
                        </Link>
                    </div>
                    <div className="right">
                        <button className="menu-toggle" onClick={toggleMenu}>
                            <FaBars className="hamburger-icon" size={24} />
                        </button>

                        <nav className={`flex gap-4 text-blue-gray-600 font-medium mobile-nav ${isOpen ? 'open':''}`}>
                            <Link href={route('wntd.field.name.index')}>
                                WNTD
                            </Link>
                            {auth.user ? (
                                <>
                                    <Link href={route('dashboard')}>
                                        Dashboard
                                    </Link>
                                    <Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href={route('login')}>
                                        Log in
                                    </Link>
                                    <Link href={route('register')}>
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>
            {children}
            <footer className='border-t shadow-sm mt-12 py-6'>
                <div className="container mx-auto">
                    <Typography color='blue-grey' className='text-center font-medium text-sm'>&copy;{d.getFullYear()} - FWP Tracker</Typography>
                </div>
            </footer>
        </div>
    );
}
