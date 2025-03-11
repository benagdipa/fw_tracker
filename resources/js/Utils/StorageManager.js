/**
 * StorageManager - A utility for safely storing data using IndexedDB via service worker or localStorage as fallback
 * This provides a consistent API regardless of the underlying storage mechanism
 */

// Check if the Service Worker API is available and registered
const isServiceWorkerAvailable = async () => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    // Use the global flag we set in bootstrap.js
    if (window.isSWAvailable && typeof window.isSWAvailable === 'function') {
      return window.isSWAvailable();
    }
    
    // Legacy check as fallback
    const registration = await navigator.serviceWorker.ready;
    return !!registration && !!navigator.serviceWorker.controller;
  } catch (error) {
    console.error('Service Worker not ready:', error);
    return false;
  }
};

// Check for memory storage availability
const isMemoryStorageAvailable = () => {
  return typeof window !== 'undefined' && window.fallbackStorage instanceof Map;
};

// Send message to service worker and get response
const sendMessageToServiceWorker = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if service worker is available
      if (!await isServiceWorkerAvailable()) {
        return reject(new Error('Service Worker not available'));
      }
      
      // Create message channel for the response
      const messageChannel = new MessageChannel();
      
      // Listen for the response
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };
      
      // Check if service worker controller exists before sending message
      if (!navigator.serviceWorker.controller) {
        console.warn('Service worker controller not available, falling back to localStorage');
        return reject(new Error('Service worker controller not available'));
      }
      
      // Send the message
      navigator.serviceWorker.controller.postMessage(data, [messageChannel.port2]);
    } catch (error) {
      reject(error);
    }
  });
};

// Check for localStorage availability
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Refresh CSRF token after storage changes (for web app)
const refreshCsrfTokenAfterStorage = () => {
  try {
    // Implement your CSRF token refresh logic here if needed
    if (window.refreshCsrfToken && typeof window.refreshCsrfToken === 'function') {
      setTimeout(() => {
        window.refreshCsrfToken();
      }, 50); // Small delay to ensure token refresh happens after storage completes
    }
  } catch (error) {
    console.error('Error refreshing CSRF token:', error);
  }
};

/**
 * Get item from storage (using service worker's IndexedDB if available, otherwise localStorage)
 * @param {string} key - The key to retrieve
 * @returns {Promise<any>} - The stored value or null if not found
 */
export const getItem = async (key) => {
  try {
    // Try service worker first
    try {
      if (await isServiceWorkerAvailable()) {
        const response = await sendMessageToServiceWorker({
          type: 'GET_DATA',
          key: key
        });
        return response.value;
      }
    } catch (swError) {
      console.warn(`Service worker storage failed for ${key}, falling back to alternatives:`, swError);
      // Continue to localStorage fallback
    }
    
    // Fallback to localStorage
    if (isLocalStorageAvailable()) {
      const value = localStorage.getItem(key);
      try {
        // Try to parse JSON
        return value ? JSON.parse(value) : null;
      } catch (e) {
        // If not JSON, return as is
        return value;
      }
    }
    
    // Final fallback to memory storage
    if (isMemoryStorageAvailable()) {
      return window.fallbackStorage.get(key) || null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting item ${key}:`, error);
    return null;
  }
};

/**
 * Set item in storage (using service worker's IndexedDB if available, otherwise localStorage)
 * @param {string} key - The key to store
 * @param {any} value - The value to store
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const setItem = async (key, value) => {
  try {
    let success = false;
    
    // Try service worker first
    try {
      if (await isServiceWorkerAvailable()) {
        const response = await sendMessageToServiceWorker({
          type: 'SET_DATA',
          key: key,
          value: value
        });
        success = response.success;
      }
    } catch (swError) {
      console.warn(`Service worker storage failed for setting ${key}, falling back to alternatives:`, swError);
      // Continue to localStorage fallback
    }
    
    // Fallback to localStorage if service worker failed
    if (!success && isLocalStorageAvailable()) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      localStorage.setItem(key, stringValue);
      success = true;
    }
    
    // Final fallback to memory storage if both failed
    if (!success && isMemoryStorageAvailable()) {
      window.fallbackStorage.set(key, value);
      success = true;
    }
    
    // Refresh CSRF token after storage changes to ensure it's synchronized
    if (success) {
      refreshCsrfTokenAfterStorage();
    }
    
    return success;
  } catch (error) {
    console.error(`Error setting item ${key}:`, error);
    return false;
  }
};

/**
 * Remove item from storage (using service worker's IndexedDB if available, otherwise localStorage)
 * @param {string} key - The key to remove
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const removeItem = async (key) => {
  try {
    let success = false;
    
    // Try service worker first
    try {
      if (await isServiceWorkerAvailable()) {
        const response = await sendMessageToServiceWorker({
          type: 'DELETE_DATA',
          key: key
        });
        success = response.success;
      }
    } catch (swError) {
      console.warn(`Service worker storage failed for removing ${key}, falling back to alternatives:`, swError);
      // Continue to localStorage fallback
    }
    
    // Fallback to localStorage if service worker failed
    if (!success && isLocalStorageAvailable()) {
      localStorage.removeItem(key);
      success = true;
    }
    
    // Final fallback to memory storage if both failed
    if (!success && isMemoryStorageAvailable()) {
      window.fallbackStorage.delete(key);
      success = true;
    }
    
    // Refresh CSRF token after storage changes to ensure it's synchronized
    if (success) {
      refreshCsrfTokenAfterStorage();
    }
    
    return success;
  } catch (error) {
    console.error(`Error removing item ${key}:`, error);
    return false;
  }
};

// Default export as an object with all methods
export default {
  getItem,
  setItem,
  removeItem,
  isServiceWorkerAvailable,
  isLocalStorageAvailable
}; 