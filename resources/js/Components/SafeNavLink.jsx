import React from 'react';
import { Link } from '@inertiajs/react';

export default function SafeNavLink({ href, routeName, children, ...props }) {
    // Function to safely handle navigation
    const handleNavigation = (e) => {
        // If this is a direct URL, let Link handle it
        if (href.startsWith('/')) {
            return;
        }

        // For route helpers, try to use them but fallback to known paths
        try {
            if (typeof route === 'function') {
                // Route function exists, let Link handle it
                return;
            }
        } catch (error) {
            // Route function doesn't exist or errored
            e.preventDefault();
            
            // Map known route names to their paths
            const routeMap = {
                'dashboard': '/dashboard',
                'wireless.sites.index': '/dashboard/wireless-sites',
                'implementation.field.name.index': '/dashboard/implementation-tracker',
                'settings.index': '/dashboard/settings',
                'roles.index': '/dashboard/roles',
                'roles.users.view': '/dashboard/users',
                'profile.edit': '/profile',
                'admin.index': '/admin',
                'admin.analytics': '/admin/analytics',
                'admin.settings': '/admin/settings',
            };
            
            // Redirect to the mapped path if available
            if (routeName && routeMap[routeName]) {
                window.location.href = routeMap[routeName];
            } else if (href) {
                // Try to extract and navigate to a path from the href
                try {
                    const url = new URL(href, window.location.origin);
                    window.location.href = url.pathname;
                } catch (urlError) {
                    console.error('Navigation error:', urlError);
                }
            }
        }
    };

    return (
        <Link 
            href={href} 
            {...props} 
            onClick={handleNavigation}
        >
            {children}
        </Link>
    );
} 