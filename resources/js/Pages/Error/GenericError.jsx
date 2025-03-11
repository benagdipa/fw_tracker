import React from 'react';
import { Head } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';

export default function GenericError({ auth, statusCode = 500, errorMessage = null }) {
  return (
    <Authenticated user={auth.user}>
      <Head title={`Error ${statusCode}`} />
      
      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center mb-6">
              <div className="bg-red-100 rounded-full p-3 mr-4">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {statusCode === 500 ? 'Something went wrong' : `Error ${statusCode}`}
              </h1>
            </div>
            
            <div className="prose max-w-none mb-8">
              <p className="text-lg text-gray-700">
                {errorMessage || "We've encountered an unexpected error while processing your request. Our team has been notified and is working on the issue."}
              </p>
              
              <p className="mt-4 text-gray-600">
                Here are some things you can try:
              </p>
              
              <ul className="mt-2 space-y-2 text-gray-600 list-disc pl-5">
                <li>Refresh the page and try again</li>
                <li>Go back to the previous page</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try accessing the page later</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload Page
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>
              
              <a
                href="/"
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </Authenticated>
  );
} 