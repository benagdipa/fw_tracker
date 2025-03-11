import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Error({ message = "An unexpected error occurred", status = 500 }) {
  return (
    <>
      <Head title="Error" />
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-500" />
              <h2 className="mt-4 text-2xl font-medium text-gray-900">
                {status === 404 ? 'Page Not Found' : 'Error'}
              </h2>
              <p className="mt-2 text-base text-gray-500">
                {message}
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <HomeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Return to Dashboard
                </Link>
              </div>
              <div className="mt-6">
                <nav className="flex justify-center" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-4">
                    <li>
                      <div>
                        <Link href="/" className="text-gray-400 hover:text-gray-500">
                          Dashboard
                        </Link>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <ChevronRightIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                        <span className="ml-4 text-sm font-medium text-gray-500">Error</span>
                      </div>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 