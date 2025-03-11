import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { router } from '@inertiajs/react';

/**
 * Error handling utilities for the application
 */

/**
 * Log an error to the server error logging endpoint
 * @param {Object} errorData - Error data to be logged
 * @returns {Promise} - Promise resolving to the response from the error logging endpoint
 */
export const logError = (error, context = '', showToast = true) => {
  // Log the error to console
  console.error(`[${context}] Error:`, error);
  
  // Format error object
  const errorData = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    context: context,
    componentStack: error.componentStack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    errorId: `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    additionalData: error.additionalData || {}
  };
  
  // Show toast notification if enabled
  if (showToast) {
    toast.error(error.message || 'An unexpected error occurred');
  }
  
  // Send error to server endpoint
  try {
    // Use post request to dedicated endpoint
    axios.post('/api/log-client-error', errorData)
      .catch(err => {
        // Silently fail - don't want to cause infinite error loop
        console.error('Failed to send error to server:', err);
      });
    
    return errorData.errorId;
  } catch (e) {
    // If logging fails, just log to console
    console.error('Failed to log error to server:', e);
    return errorData.errorId;
  }
};

/**
 * Redirect to the error page with a specific error code and message
 * @param {number} code - HTTP error code
 * @param {string} message - Error message
 */
export const redirectToErrorPage = (statusCode, message) => {
  // Show error toast
  toast.error(message || 'An unexpected error occurred');
  
  // Return error UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Error {statusCode}</h1>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

/**
 * Handle Axios errors with consistent formatting
 * @param {Error} error - Error object from Axios
 * @param {boolean} showToast - Whether to show a toast notification
 * @returns {Object} - Formatted error object
 */
export const handleAxiosError = (error, showToast = true) => {
  let message = 'An unexpected error occurred';
  let statusCode = 500;
  let details = null;

  if (error.response) {
    // Server responded with an error status
    statusCode = error.response.status;
    message = error.response.data.message || `Error ${statusCode}`;
    details = error.response.data.errors || error.response.data.details;
  } else if (error.request) {
    // Request was made but no response received
    message = 'No response received from server';
    statusCode = 0;
  }

  // Show toast notification if requested
  if (showToast) {
    toast.error(message);
  }

  // Log error to server
  logError(error, 'handleAxiosError', true);

  return {
    message,
    statusCode,
    details
  };
};

/**
 * Format validation errors from Laravel into a simple object
 * @param {Object} errors - Laravel validation errors object
 * @returns {Object} - Simple errors object with field names as keys
 */
export const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  
  if (!errors) return formattedErrors;
  
  Object.keys(errors).forEach(key => {
    formattedErrors[key] = Array.isArray(errors[key]) 
      ? errors[key][0] 
      : errors[key];
  });
  
  return formattedErrors;
};

/**
 * Create a higher-order component that catches errors for React components
 * @param {React.Component} Component - The component to wrap
 * @param {string} componentName - The name of the component for error reporting
 */
export const withErrorBoundary = (Component, componentName = 'UnknownComponent') => {
  // Use a named function to help with debugging
  const ErrorBoundaryWrapper = (props) => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      logError(error, `ErrorBoundary(${componentName})`, true);
      return null;
    }
  };
  
  ErrorBoundaryWrapper.displayName = `withErrorBoundary(${componentName})`;
  return ErrorBoundaryWrapper;
};

/**
 * Global error handler to catch unhandled Promise rejections
 */
export const setupGlobalErrorHandlers = () => {
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), 'GlobalError', true);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason || new Error('Unhandled Promise rejection'), 'UnhandledPromise', true);
  });
};

export default {
  logError,
  redirectToErrorPage,
  withErrorBoundary,
  setupGlobalErrorHandlers,
  handleAxiosError,
  formatValidationErrors
}; 