import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
const withMT = require("@material-tailwind/react/utils/withMT");

/** @type {import('tailwindcss').Config} */
export default withMT({
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './node_modules/@material-tailwind/react/components/**/*.{js,ts,jsx,tsx}',
        './node_modules/@material-tailwind/react/theme/components/**/*.{js,ts,jsx,tsx}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: defaultTheme.fontFamily.sans,
            },
            colors: {
                primary: {
                    50: '#e6f0fa',
                    100: '#cce0f5',
                    200: '#99c2eb',
                    300: '#66a3e0',
                    400: '#3385d6',
                    500: '#0057B8', // Main primary color
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
                    500: '#00AEEF', // Main secondary color
                    600: '#0099d1',
                    700: '#0085b3',
                    800: '#006e94',
                    900: '#005876',
                },
                success: {
                    500: '#10b981',
                },
                warning: {
                    500: '#f59e0b',
                },
                danger: {
                    500: '#ef4444',
                },
                gray: {
                    light: '#f7f9fb',
                    DEFAULT: '#6b7280',
                    dark: '#374151',
                },
            },
            boxShadow: {
                card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            borderRadius: {
                DEFAULT: '0.375rem',
            },
        },
    },

    plugins: [forms],
});
