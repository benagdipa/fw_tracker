import { router } from '@inertiajs/react';

/**
 * Navigate to a route with smooth transitions
 * 
 * @param {string} routeName - The route name to navigate to
 * @param {Object} params - Parameters for the route
 * @param {Object} options - Additional options for navigation
 * @returns {Promise} - Promise that resolves when navigation is complete
 */
export const navigateTo = (routeName, params = {}, options = {}) => {
    // Default options
    const defaultOptions = {
        preserveScroll: false,
        preserveState: false,
        ...options,
    };
    
    // Add a small timeout before navigation to allow for animation to start
    return new Promise((resolve) => {
        // Signal the start of navigation for animations
        document.dispatchEvent(new Event('inertia:start'));
        
        // Add a small delay to ensure animations begin properly
        setTimeout(() => {
            router.visit(route(routeName, params), {
                ...defaultOptions,
                onFinish: () => {
                    // Signal the end of navigation for animations
                    document.dispatchEvent(new Event('inertia:finish'));
                    resolve();
                },
            });
        }, 50);
    });
};

/**
 * Adds a hover effect to links for better UX
 * Call this in component mount to enhance links with hover effects
 */
export const enhanceLinks = () => {
    // Find all links in the component
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
        // Skip links with no href or with # (in-page links)
        if (!link.getAttribute('href') || link.getAttribute('href') === '#') {
            return;
        }
        
        // Add hover class for interactive feedback
        link.addEventListener('mouseenter', () => {
            link.classList.add('link-hover-effect');
        });
        
        link.addEventListener('mouseleave', () => {
            link.classList.remove('link-hover-effect');
        });
    });
}; 