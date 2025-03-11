import React, { createContext, useContext, useState, useEffect } from 'react';
import StorageManager from '../Utils/StorageManager';

const ThemeContext = createContext();

// Theme object with default values
const defaultTheme = {
    colors: {
        primary: '#0057B8',
        secondary: '#00AEEF',
        background: '#ffffff',
        text: '#333333',
        // Add other color values as needed
    },
    fontSizes: {
        small: '0.875rem',
        medium: '1rem',
        large: '1.25rem',
    },
    // Add other theme properties as needed
};

// Use the global refreshCsrfToken function from bootstrap.js
const refreshTokenAfterThemeChange = () => {
    if (window.refreshCsrfToken && typeof window.refreshCsrfToken === 'function') {
        setTimeout(() => {
            window.refreshCsrfToken();
            console.log('CSRF token refreshed after theme change');
        }, 50); // Small delay to ensure token is refreshed after theme change is complete
    }
};

export function ThemeProvider({ children }) {
    // State to track if we're still loading dark mode preference
    const [isLoading, setIsLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [theme, setTheme] = useState({
        ...defaultTheme,
        mode: 'light'
    });

    // Load the dark mode preference from storage
    useEffect(() => {
        async function loadDarkModePreference() {
            try {
                const savedDarkMode = await StorageManager.getItem('darkMode');
                // savedDarkMode could be 'true' string or true boolean depending on storage mechanism
                const isDarkMode = savedDarkMode === true || savedDarkMode === 'true';
                setDarkMode(isDarkMode);
                
                if (isDarkMode) {
                    document.documentElement.classList.add('dark');
                    setTheme({
                        ...defaultTheme,
                        mode: 'dark',
                        colors: {
                            ...defaultTheme.colors,
                            background: '#1a1a1a',
                            text: '#f5f5f5',
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading dark mode preference:', error);
            } finally {
                setIsLoading(false);
            }
        }
        
        loadDarkModePreference();
    }, []);
    
    // Update storage and apply theme when dark mode changes
    useEffect(() => {
        if (isLoading) return; // Skip the initial render
        
        try {
            // Update the DOM
            if (darkMode) {
                document.documentElement.classList.add('dark');
                setTheme({
                    ...defaultTheme,
                    mode: 'dark',
                    colors: {
                        ...defaultTheme.colors,
                        background: '#1a1a1a',
                        text: '#f5f5f5',
                    }
                });
            } else {
                document.documentElement.classList.remove('dark');
                setTheme({
                    ...defaultTheme,
                    mode: 'light'
                });
            }
            
            // Save the preference
            StorageManager.setItem('darkMode', darkMode)
                .then(() => {
                    // Refresh CSRF token after theme change to ensure it's synchronized
                    refreshTokenAfterThemeChange();
                })
                .catch(error => {
                    console.error('Error saving dark mode preference:', error);
                });
        } catch (error) {
            console.error('Error updating dark mode:', error);
        }
    }, [darkMode, isLoading]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
} 