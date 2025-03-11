/**
 * Cache busting script
 * This adds a timestamp query parameter to script URLs to prevent caching
 * It also clears any running animations when the page reloads
 */

// Function to clear loading animations
function clearLoadingAnimations() {
    // Clear any spinners that might be running
    const spinners = document.querySelectorAll('.animate-spin');
    spinners.forEach(el => {
        el.classList.remove('animate-spin');
    });
    
    // Clear any pulse animations
    const pulses = document.querySelectorAll('.animate-pulse');
    pulses.forEach(el => {
        el.classList.remove('animate-pulse');
    });
    
    // Remove any loading containers
    const loadingContainers = document.querySelectorAll('.loading-indicator-container');
    loadingContainers.forEach(el => {
        el.remove();
    });
    
    console.log('✅ Animation states cleared');
}

// Function to add cache-busting parameters to all resources
function bustCache() {
    // Add timestamp to all scripts
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        const currentSrc = script.getAttribute('src');
        if (!currentSrc.includes('?v=')) {
            script.setAttribute('src', `${currentSrc}?v=${Date.now()}`);
        }
    });
    
    // Add timestamp to all stylesheets
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
        const currentHref = link.getAttribute('href');
        if (!currentHref.includes('?v=')) {
            link.setAttribute('href', `${currentHref}?v=${Date.now()}`);
        }
    });
    
    console.log('✅ Cache busting applied to all resources');
}

// Execute on page load
document.addEventListener('DOMContentLoaded', function() {
    clearLoadingAnimations();
    bustCache();
});

// Execute on each navigation within the app
document.addEventListener('inertia:navigate', clearLoadingAnimations);

// Export functions for manual use
window.clearLoadingAnimations = clearLoadingAnimations;
window.bustCache = bustCache;
window.forceClearAndReload = function() {
    clearLoadingAnimations();
    setTimeout(() => {
        window.location.reload(true);
    }, 100);
};

console.log('✅ Cache buster and animation cleaner initialized'); 