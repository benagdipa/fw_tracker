import './bootstrap';
import '../css/app.css';
import '../css/data-grid-custom.css';
import '../css/button-styles.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import StoreProvider from './Store/Providers/StoreProvider';
import { setupGlobalErrorHandlers } from './Utils/ErrorHandler.jsx';
import { ThemeProvider } from '@/Context/ThemeContext';
import { ThemeProvider as MaterialTailwindProvider } from "@material-tailwind/react";

// Material Tailwind configuration
const materialTailwindTheme = {
    colors: {
        primary: {
            50: '#e6f0fa',
            100: '#cce0f5',
            200: '#99c2eb',
            300: '#66a3e0',
            400: '#3385d6',
            500: '#0057B8',
            600: '#0048a3',
            700: '#003d8f',
            800: '#00326b',
            900: '#002247',
        },
        secondary: {
            50: '#e6f8fe',
            100: '#cdf1fd',
            200: '#9be4fb',
            300: '#68d6f9',
            400: '#36c9f7',
            500: '#00AEEF',
            600: '#0099d1',
            700: '#0085b3',
            800: '#006e94',
            900: '#005876',
        },
        blue: {
            50: '#eff6ff', 
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6', 
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
        }
    },
    fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        body: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
    },
    fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
    },
    shape: {
        borderRadius: {
            xs: '0.125rem',
            sm: '0.25rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
        }
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    components: {
        button: {
            defaultProps: {
                color: "primary",
                size: "md",
                variant: "filled",
            },
            styles: {
                base: {
                    initial: {
                        fontWeight: "500",
                        borderRadius: "0.375rem"
                    },
                },
            },
        },
        card: {
            defaultProps: {
                color: "white",
                shadow: true,
                variant: "filled",
            },
            styles: {
                base: {
                    initial: {
                        borderRadius: "0.375rem",
                    },
                },
            },
        },
        dialog: {
            defaultProps: {
                size: "md",
                dismiss: {},
                animate: {
                    unmount: {},
                    mount: {},
                },
            },
            styles: {
                base: {
                    backdrop: {
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    },
                    container: {
                        borderRadius: "0.375rem",
                    },
                },
            },
        },
        input: {
            defaultProps: {
                size: "md",
                color: "primary",
                variant: "outlined",
            },
            styles: {
                base: {
                    container: {
                        borderRadius: "0.375rem",
                    },
                },
            },
        },
        popover: {
            defaultProps: {
                placement: "bottom",
                offset: 5,
                dismiss: {},
                animate: {
                    unmount: {},
                    mount: {},
                },
            },
            styles: {
                base: {
                    container: {
                        borderRadius: "0.375rem",
                    },
                },
            },
        },
        select: {
            defaultProps: {
                variant: "outlined",
                size: "md",
                color: "primary",
            },
            styles: {
                base: {
                    container: {
                        borderRadius: "0.375rem",
                    },
                },
            },
        }
    }
};

// Initialize global error handlers
setupGlobalErrorHandlers();

// Suppress warnings about defaultProps in react-beautiful-dnd
// This can be removed when the library is updated or when React 18 support is dropped
if (process.env.NODE_ENV === 'development') {
    const originalConsoleError = console.error;
    console.error = function filterWarnings(msg, ...args) {
        if (typeof msg === 'string' && msg.includes('defaultProps will be removed from memo components')) {
            return;
        }
        originalConsoleError(msg, ...args);
    };
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        try {
            return await resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx'));
        } catch (error) {
            console.error(`Failed to load page component: ${name}`, error);
            
            // Log the error
            const { logError } = await import('./Utils/ErrorHandler.jsx');
            logError(error, `PageResolve(${name})`, true);
            
            // If the page doesn't exist, handle different types of errors
            if (name.startsWith('Error/')) {
                // If we're already trying to load an error page, load the generic error page
                return import('./Pages/Error/GenericError.jsx');
            } else if (error.message && error.message.includes('Failed to fetch dynamically imported module')) {
                // For 404 errors (page not found)
                return import('./Pages/Error/GenericError.jsx').then(module => {
                    return {
                        ...module,
                        default: (props) => module.default({ ...props, statusCode: 404 })
                    };
                });
            } else {
                // For other errors
                return import('./Pages/Error/GenericError.jsx');
            }
        }
    },
    setup({ el, App, props, plugin }) {
        const root = createRoot(el);

        root.render(
            <MaterialTailwindProvider value={materialTailwindTheme}>
                <ThemeProvider>
                    <StoreProvider>
                        <App {...props} plugin={plugin} />
                    </StoreProvider>
                </ThemeProvider>
            </MaterialTailwindProvider>
        );
    },
    progress: {
        color: '#4B5563',
        showSpinner: false,
        delay: 100,
    },
});
