import React, { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';

export default function PageTransition({ children }) {
    const [show, setShow] = useState(true);
    const [content, setContent] = useState(children);
    const [transitionName, setTransitionName] = useState('fade');
    
    // Track direction of navigation for slide animations
    const getTransitionDirection = (event) => {
        // If there's a saved position in the history state, determine direction
        if (event.detail?.visit?.url) {
            // Store the current path for comparison
            const currentPath = window.location.pathname;
            
            // Default to fade transition
            let newTransition = 'fade';
            
            // Paths for common navigation patterns
            const dashboardPaths = ['/dashboard', '/'];
            const detailPaths = /\/[^\/]+\/\d+/; // Matches patterns like /items/123
            
            // Moving to dashboard from detail = slide right
            if (dashboardPaths.includes(event.detail.visit.url) && detailPaths.test(currentPath)) {
                newTransition = 'slide-right';
            } 
            // Moving from dashboard to detail = slide left
            else if (detailPaths.test(event.detail.visit.url) && dashboardPaths.includes(currentPath)) {
                newTransition = 'slide-left';
            }
            // Moving between similar levels = fade
            else {
                newTransition = 'fade';
            }
            
            setTransitionName(newTransition);
        }
    };
    
    useEffect(() => {
        // Update content when children change
        setContent(children);
        
        // Handle navigation events
        const handleStart = (event) => {
            getTransitionDirection(event);
            setShow(false);
        };
        
        const handleSuccess = () => {
            // Delay slightly to ensure DOM update
            window.scrollTo(0, 0);
            setTimeout(() => {
                setShow(true);
            }, 50);
        };
        
        // Add event listeners using document
        document.addEventListener('inertia:before', handleStart);
        document.addEventListener('inertia:success', handleSuccess);
        
        return () => {
            // Clean up event listeners
            document.removeEventListener('inertia:before', handleStart);
            document.removeEventListener('inertia:success', handleSuccess);
        };
    }, [children]);
    
    return (
        <>
            <style>
                {`
                    .page-transition-wrapper {
                        min-height: 200px;
                        will-change: transform, opacity;
                    }
                    
                    @-moz-document url-prefix() {
                        .page-transition-wrapper {
                            backface-visibility: hidden;
                            transform-style: preserve-3d;
                        }
                    }
                `}
            </style>
            
            <Transition
                show={show}
                enter={`transition-all duration-300 ease-out`}
                enterFrom={getEnterFromClass(transitionName)}
                enterTo={getEnterToClass(transitionName)}
                leave={`transition-all duration-200 ease-in`}
                leaveFrom={getLeaveFromClass(transitionName)}
                leaveTo={getLeaveToCLass(transitionName)}
                as="div"
                className="page-transition-wrapper"
            >
                {content}
            </Transition>
        </>
    );
}

// Helper functions to get transition classes
function getEnterFromClass(transitionName) {
    switch (transitionName) {
        case 'slide-left':
            return 'transform translate-x-10 opacity-0';
        case 'slide-right':
            return 'transform -translate-x-10 opacity-0';
        case 'slide-up':
            return 'transform translate-y-10 opacity-0';
        case 'slide-down':
            return 'transform -translate-y-10 opacity-0';
        case 'fade':
        default:
            return 'opacity-0';
    }
}

function getEnterToClass(transitionName) {
    switch (transitionName) {
        case 'slide-left':
        case 'slide-right':
        case 'slide-up':
        case 'slide-down':
            return 'transform translate-x-0 translate-y-0 opacity-100';
        case 'fade':
        default:
            return 'opacity-100';
    }
}

function getLeaveFromClass(transitionName) {
    switch (transitionName) {
        case 'slide-left':
        case 'slide-right':
        case 'slide-up':
        case 'slide-down':
            return 'transform translate-x-0 translate-y-0 opacity-100';
        case 'fade':
        default:
            return 'opacity-100';
    }
}

function getLeaveToCLass(transitionName) {
    switch (transitionName) {
        case 'slide-left':
            return 'transform -translate-x-10 opacity-0';
        case 'slide-right':
            return 'transform translate-x-10 opacity-0';
        case 'slide-up':
            return 'transform -translate-y-10 opacity-0';
        case 'slide-down':
            return 'transform translate-y-10 opacity-0';
        case 'fade':
        default:
            return 'opacity-0';
    }
} 