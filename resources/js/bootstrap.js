import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // Ensure cookies are sent with all requests

// Check if we're in a standard web context (not in a restricted context like iframe)
const isWebContext = () => {
    try {
        return window.self === window.top && 
               typeof window.localStorage !== 'undefined' && 
               typeof document.cookie !== 'undefined';
    } catch (e) {
        // If we can't access window.top due to cross-origin restrictions
        return false;
    }
};

// Register Service Worker with improved error handling
if ('serviceWorker' in navigator && isWebContext()) {
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
    // Service Workers not supported by browser or not in web context
    console.warn('Service Workers are not available in this context');
    window.serviceWorkerRegistered = false;
    window.isSWAvailable = () => false;
    
    // Create a fallback memory storage
    window.fallbackStorage = new Map();
    console.log('Created fallback memory storage due to lack of service worker support');
}

// Store the last error for debugging
window.axios.lastError = null;

// Improved getCookie function for more reliable cookie reading
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const cookiePart = parts.pop().split(';').shift();
        try {
            return decodeURIComponent(cookiePart);
        } catch (e) {
            return cookiePart; // Return without decoding if it fails
        }
    }
    return null;
};

// Enhanced CSRF Token handling - improved implementation
let refreshing = false;  // Flag to prevent concurrent refresh attempts
let refreshAttempts = 0; // Counter to prevent infinite loops
const MAX_REFRESH_ATTEMPTS = 3; // Maximum number of refresh attempts

// Improved getCsrfToken function for more reliable token extraction
const getCsrfToken = () => {
    // First try meta tag method (most reliable)
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token && token.content) {
        return token.content;
    }
    
    // Try getting from Inertia props
    if (window.Laravel && window.Laravel.csrfToken) {
        return window.Laravel.csrfToken;
    }
    
    // Fallback to cookie method - ensure proper decoding
    const tokenFromCookie = getCookie('XSRF-TOKEN');
    if (tokenFromCookie) {
        try {
            // Laravel encodes the XSRF-TOKEN cookie
            return decodeURIComponent(tokenFromCookie);
        } catch (e) {
            return tokenFromCookie;
        }
    }
    
    return null;
};

// Make the function available globally for components
window.refreshCsrfToken = async (forceRefresh = false) => {
    if (forceRefresh) {
        // Actively fetch a new token from the server
        try {
            console.log('Actively fetching new CSRF token from server');
            
            // Create a timeout promise to prevent hanging if the server doesn't respond
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), 5000);
            });
            
            // Try both endpoints - the new one first, then fallback to the old one
            let response;
            try {
                // First try the new dedicated endpoint
                console.log('Trying new CSRF refresh endpoint');
                response = await Promise.race([
                    fetch('/api/refresh-csrf-token', {
                        method: 'GET',
                        credentials: 'same-origin',
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Cache-Control': 'no-cache'
                        }
                    }),
                    timeoutPromise
                ]);
            } catch (error) {
                console.log('New endpoint failed, trying legacy endpoint');
                // If that fails, try the old endpoint as fallback
                response = await Promise.race([
                    fetch('/refresh-csrf', {
                        method: 'GET',
                        credentials: 'same-origin',
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Cache-Control': 'no-cache'
                        }
                    }),
                    timeoutPromise
                ]);
            }
            
            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    // Set both headers that Laravel might check for CSRF protection
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = data.token;
                    window.axios.defaults.headers.common['X-XSRF-TOKEN'] = data.token;
                    
                    // Update meta tag if it exists
                    const metaToken = document.head.querySelector('meta[name="csrf-token"]');
                    if (metaToken) {
                        metaToken.content = data.token;
                    }
                    
                    // Also set Laravel global object if it exists
                    if (!window.Laravel) {
                        window.Laravel = {};
                    }
                    window.Laravel.csrfToken = data.token;
                    
                    console.log('Successfully retrieved fresh token:', data.token.substring(0, 10) + '...');
                    
                    // Set the XSRF-TOKEN cookie directly as backup
                    document.cookie = `XSRF-TOKEN=${encodeURIComponent(data.token)}; path=/; SameSite=Lax`;
                    
                    return data.token;
                }
            } else {
                // Try to get a useful error message
                try {
                    const errorData = await response.json();
                    console.error('Server responded with error:', errorData);
                } catch (e) {
                    console.error('Server error status:', response.status);
                }
                throw new Error(`Server responded with status: ${response.status}`);
            }
            throw new Error('Failed to get token from server');
        } catch (error) {
            console.error('Error refreshing CSRF token:', error);
            
            // Fallback: try to use an existing token even if refresh failed
            const existingToken = getCsrfToken();
            if (existingToken) {
                console.log('Using existing token as fallback after refresh failure');
                return existingToken;
            }
        }
    }
    
    // Use existing token if available
    const token = getCsrfToken();
    if (token) {
        // Set both headers that Laravel might check for CSRF protection
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        window.axios.defaults.headers.common['X-XSRF-TOKEN'] = token;
        
        // Update meta tag if it exists
        const metaToken = document.head.querySelector('meta[name="csrf-token"]');
        if (metaToken) {
            metaToken.content = token;
        }
        
        // Also set Laravel global object if it exists
        if (!window.Laravel) {
            window.Laravel = {};
        }
        window.Laravel.csrfToken = token;

        return token;
    }
    
    // If no token is found and forceRefresh is false, try to get one now
    if (!forceRefresh) {
        return window.refreshCsrfToken(true);
    }
    
    return null;
};

// Add request interceptor to ensure fresh token on each request
axios.interceptors.request.use(
    config => {
        // Skip CSRF token for the token refresh endpoint itself
        if (config.url === '/refresh-csrf') {
            return config;
        }
        
        // Update the token on each request to ensure it's fresh
        const token = getCsrfToken();
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
            config.headers['X-XSRF-TOKEN'] = token;
        } else {
            console.warn(`[Warning] No CSRF token found for request to: ${config.url}`);
        }
        
        return config;
    },
    error => Promise.reject(error)
);

// Initialize CSRF token
(async () => {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
        window.refreshCsrfToken();
        console.log('Initial CSRF token set:', csrfToken.substring(0, 10) + '...');
    } else {
        console.warn('CSRF token not found - attempting to fetch a new one');
        await window.refreshCsrfToken(true);
    }
})();

// Add interceptor to handle 419 (CSRF token mismatch) errors with better recovery
axios.interceptors.response.use(
    response => response,
    async error => {
        // Store the last error for debugging
        window.axios.lastError = error;
        
        const originalRequest = error.config;
        const status = error.response ? error.response.status : null;
        
        // Handle CSRF token mismatch errors
        if (status === 419 && !originalRequest._retry) {
            console.warn('CSRF token mismatch detected (419), attempting to refresh token');
            
            // If we've already tried too many times, force page reload
            if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
                console.error(`Maximum refresh attempts (${MAX_REFRESH_ATTEMPTS}) reached, reloading page`);
                // Add a small delay to ensure logs are visible
                setTimeout(() => window.location.reload(), 500);
                return Promise.reject(error);
            }
            
            // Prevent concurrent refresh attempts
            if (refreshing) {
                console.log('Token refresh already in progress, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                return axios(originalRequest);
            }
            
            refreshing = true;
            refreshAttempts++;
            originalRequest._retry = true;
            
            try {
                // Get a fresh token
                const newToken = await window.refreshCsrfToken(true);
                
                if (newToken) {
                    // Update the original request with the new token
                    originalRequest.headers['X-CSRF-TOKEN'] = newToken;
                    originalRequest.headers['X-XSRF-TOKEN'] = newToken;
                    
                    console.log('Retrying request with new token');
                    refreshing = false;
                    return axios(originalRequest);
                } else {
                    throw new Error('Failed to get new token');
                }
            } catch (refreshError) {
                console.error('Error during token refresh:', refreshError);
                refreshing = false;
                
                // For login-related paths, try one more approach: direct form submission
                if (originalRequest.url.includes('login') || originalRequest.url.includes('auth')) {
                    console.log('Login-related request failed - attempting fallback approach');
                    // We don't return anything here, as the login page should handle this fallback
                }
                
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
