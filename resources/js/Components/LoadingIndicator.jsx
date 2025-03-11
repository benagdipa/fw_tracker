import React, { useEffect, useRef } from 'react';

const LoadingIndicator = ({ size = 'md', color = 'blue', text = 'Loading...' }) => {
  // Size variants
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  // Color variants
  const colors = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    amber: 'border-amber-500',
    purple: 'border-purple-500',
    gray: 'border-gray-400'
  };

  // Ref to track mounting status
  const isMounted = useRef(true);
  
  // Clean up any animations when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return (
    <div className="loading-indicator-container flex flex-col items-center justify-center p-8">
      <div className="relative">
        {/* Spinning outer ring - using CSS animation with a special class for easier cleanup */}
        <div
          className={`loading-spinner rounded-full border-t-2 border-b-2 ${colors[color]} ${sizes[size]} animate-spin`}
        />
        
        {/* Pulsing inner dot - using CSS animation with a special class */}
        <div 
          className={`loading-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-${color}-500 animate-pulse`}
          style={{ width: '30%', height: '30%' }}
        />
      </div>
      
      {text && (
        <p className="mt-4 text-gray-600 font-medium">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingIndicator; 