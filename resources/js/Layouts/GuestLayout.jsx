import React from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="w-full sm:max-w-md mt-6 px-6 py-8 bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-center mb-8">
                    <Link href="/">
                        <ApplicationLogo className="w-full h-20 fill-current text-gray-800" />
                    </Link>
                </div>
                <div className="w-full">
                    <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-white mb-6">
                        {window.location.pathname.includes('login') ? 'Sign In' : 
                         window.location.pathname.includes('register') ? 'Create Account' : 
                         window.location.pathname.includes('forgot-password') ? 'Reset Password' : 
                         'Welcome'}
                    </h2>
                    {children}
                </div>
            </div>
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} FWPM. All rights reserved.
            </div>
        </div>
    );
}
