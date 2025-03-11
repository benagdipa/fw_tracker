import React from 'react';
import { Button, Tooltip } from '@material-tailwind/react';
import { motion } from 'framer-motion';

/**
 * Standardized ActionButton component for UI consistency across all pages.
 * 
 * @param {string} variant - Button variant: 'filled', 'outlined', 'gradient', 'text' (default: 'filled')
 * @param {string} color - Button color theme: 'blue', 'red', 'green', 'amber', 'purple', etc. (default: 'blue')
 * @param {string} size - Button size: 'sm', 'md', 'lg' (default: 'md')
 * @param {React.ReactNode} icon - Icon to display before text
 * @param {React.ReactNode} endIcon - Icon to display after text
 * @param {string} tooltip - Optional tooltip text
 * @param {string} className - Additional CSS classes
 * @param {boolean} isLoading - Whether the button is in loading state
 * @param {boolean} isDisabled - Whether the button is disabled
 * @param {function} onClick - Click handler
 * @param {any} children - Button content
 */
const ActionButton = ({
  variant = 'filled',
  color = 'blue',
  size = 'md',
  icon,
  endIcon,
  tooltip,
  className = '',
  isLoading = false,
  isDisabled = false,
  onClick,
  children,
  ...rest
}) => {
  // Size utilities
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5'
  };
  
  // Spinner component for loading state
  const Spinner = () => (
    <svg 
      className="animate-spin h-4 w-4 mr-2" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
  
  // Button content
  const buttonContent = (
    <div className="flex items-center justify-center gap-2">
      {isLoading ? <Spinner /> : icon}
      {children && <span>{children}</span>}
      {endIcon && !isLoading && endIcon}
    </div>
  );
  
  // Regular button (no tooltip)
  const regularButton = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <Button
        variant={variant}
        color={color}
        className={`${sizeClasses[size]} ${className} shadow-sm transition-all`}
        disabled={isDisabled || isLoading}
        onClick={onClick}
        {...rest}
      >
        {buttonContent}
      </Button>
    </motion.div>
  );
  
  // Return button with or without tooltip
  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        {regularButton}
      </Tooltip>
    );
  }
  
  return regularButton;
};

export default ActionButton; 