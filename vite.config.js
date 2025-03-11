import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react({
            include: "**/*.{jsx,tsx}",
        }),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
        extensions: ['.js', '.jsx', '.json', '.css']
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('@material-tailwind/react')) {
                            return 'material-tailwind';
                        }
                        if (id.includes('@heroicons/react')) {
                            return 'heroicons';
                        }
                        if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
                            return 'charts';
                        }
                        return 'vendor';
                    }
                }
            },
        },
        commonjsOptions: {
            transformMixedEsModules: true,
        }
    },
    optimizeDeps: {
        include: [
            '@material-tailwind/react',
            'react',
            'react-dom',
            '@inertiajs/react',
            'axios',
            'pusher-js',
            'laravel-echo'
        ]
    },
    server: {
        hmr: {
            host: 'localhost',
        },
    },
    ssr: {
        noExternal: ['@material-tailwind/react', '@heroicons/react', 'chart.js', 'react-chartjs-2']
    }
});
