import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // Ensure cookies are sent with all requests

// Register Service Worker with improved error handling
if ('serviceWorker' in navigator) {
    // Global flag to track if service worker was successfully registered
    window.serviceWorkerRegistered = false;
    
    window.addEventListener('load', async () => {
        try {
            // Check for any existing service workers that might need updating
            const existingRegistration = await navigator.serviceWorker.getRegistration();
            if (existingRegistration) {
                // Force update if needed
                await existingRegistration.update();
                window.serviceWorkerRegistered = true;
                console.log('Updated existing Service Worker');
            } else {
                // Register or update the service worker
                const registration = await navigator.serviceWorker.register('/service-worker.js', {
                    updateViaCache: 'none', // Don't use cached version, always check for updates
                    scope: '/' // Set explicit scope
                });
                window.serviceWorkerRegistered = true;
                console.log('Service Worker registered with scope:', registration.scope);
            }
            
            // Add controller change event listener
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('Service Worker controller changed');
            });
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            window.serviceWorkerRegistered = false;
            
            // If registration fails, try to unregister any existing service workers
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                    console.log('Unregistered stale service worker');
                }
            } catch (unregError) {
                console.error('Error unregistering service worker:', unregError);
            }
            
            // Create a fallback memory storage
            window.fallbackStorage = new Map();
            console.log('Created fallback memory storage due to service worker issues');
        }
    });
    
    // Fallback function for when service worker isn't available
    window.isSWAvailable = () => window.serviceWorkerRegistered && 
                                 navigator.serviceWorker.controller;
} else {
    // Service Workers not supported by browser
    console.warn('Service Workers are not supported in this browser');
    window.serviceWorkerRegistered = false;
    window.isSWAvailable = () => false;
    
    // Create a fallback memory storage
    window.fallbackStorage = new Map();
    console.log('Created fallback memory storage due to lack of service worker support');
}

// Store the last error for debugging
window.axios.lastError = null;

// CSRF Token handling - improved implementation with loop prevention
let refreshing = false;  // Flag to prevent concurrent refresh attempts
let refreshAttempts = 0; // Counter to prevent infinite loops
const MAX_REFRESH_ATTEMPTS = 3; // Maximum number of refresh attempts

const getCsrfToken = () => {
    // First try meta tag method
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        return token.content;
    }
    
    // Fallback to cookie method
    const tokenFromCookie = getCookie('XSRF-TOKEN');
    try {
        return tokenFromCookie ? decodeURIComponent(tokenFromCookie) : null;
    } catch (e) {
        console.error('Error decoding CSRF token from cookie:', e);
        return tokenFromCookie; // Return without decoding if it fails
    }
};

// Helper function to get cookies
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
};

// Add request interceptor to ensure fresh token on each request
axios.interceptors.request.use(
    config => {
        // Update the token on each request to ensure it's fresh
        const token = getCsrfToken();
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
            config.headers['X-XSRF-TOKEN'] = token;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Set the CSRF token
const csrfToken = getCsrfToken();
if (csrfToken) {
    // Set both headers that Laravel might check for CSRF protection
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
    window.axios.defaults.headers.common['X-XSRF-TOKEN'] = csrfToken;
    console.log('Initial CSRF token set:', csrfToken.substring(0, 10) + '...');
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// Add interceptor to handle 419 (CSRF token mismatch) errors with better recovery
axios.interceptors.response.use(
    response => response,
    async error => {
        // Store the last error for debugging
        window.axios.lastError = error;
        console.log('Axios error:', error.response ? error.response.status : 'No response', error.message);

        const originalRequest = error.config;
        
        // Only handle 419 errors that haven't been retried yet
        if (error.response && error.response.status === 419 && !originalRequest._retry) {
            console.warn('CSRF token mismatch detected, attempting to refresh token');
            
            // If we've already tried too many times, just reload the page
            if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
                console.error(`Maximum refresh attempts (${MAX_REFRESH_ATTEMPTS}) reached, reloading page`);
                window.location.reload();
                return Promise.reject(error);
            }
            
            // If a refresh is already in progress, wait for it
            if (refreshing) {
                console.log('Token refresh already in progress, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                return axios(originalRequest);
            }
            
            refreshing = true;
            refreshAttempts++;
            originalRequest._retry = true;
            
            try {
                // First try our special refresh endpoint
                console.log('Attempting to refresh token via /refresh-csrf');
                const response = await fetch('/refresh-csrf', {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.token) {
                        console.log('Got new token from /refresh-csrf:', data.token.substring(0, 10) + '...');
                        
                        // Update headers with new token
                        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = data.token;
                        window.axios.defaults.headers.common['X-XSRF-TOKEN'] = data.token;
                        originalRequest.headers['X-CSRF-TOKEN'] = data.token;
                        originalRequest.headers['X-XSRF-TOKEN'] = data.token;
                        
                        // Update meta tag
                        const metaToken = document.head.querySelector('meta[name="csrf-token"]');
                        if (metaToken) {
                            metaToken.content = data.token;
                        }
                        
                        console.log('Successfully refreshed CSRF token');
                        refreshing = false;
                        return axios(originalRequest);
                    }
                }
                
                // If the special endpoint fails, try visiting the login page
                console.log('Falling back to login page fetch for token refresh');
                await fetch('/login', {
                    method: 'GET',
                    credentials: 'same-origin',
                    redirect: 'manual'
                });
                
                // Get the new token
                const newToken = getCsrfToken();
                if (newToken) {
                    console.log('Got new token from /login:', newToken.substring(0, 10) + '...');
                    
                    // Update headers with new token
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                    window.axios.defaults.headers.common['X-XSRF-TOKEN'] = newToken;
                    originalRequest.headers['X-CSRF-TOKEN'] = newToken;
                    originalRequest.headers['X-XSRF-TOKEN'] = newToken;
                    
                    console.log('Successfully refreshed CSRF token');
                    refreshing = false;
                    return axios(originalRequest);
                } else {
                    console.error('Failed to get a new CSRF token even after refresh');
                    refreshing = false;
                    window.location.reload();
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                console.error('Error during token refresh:', refreshError);
                refreshing = false;
                window.location.reload();
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

// Pusher and Echo configuration
window.Pusher = Pusher;

if (import.meta.env.VITE_PUSHER_APP_KEY) {
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
        wsHost: import.meta.env.VITE_PUSHER_HOST ? import.meta.env.VITE_PUSHER_HOST : `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER}.pusher.com`,
        wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
        wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    });
}
