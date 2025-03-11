import React from 'react';
import { DialogBody } from '@material-tailwind/react';
import { motion } from 'framer-motion';

/**
 * A standardized dialog body wrapper component for consistent UI across all pages.
 * Wraps the dialog body content with animation and standardized styling.
 * 
 * @param {React.ReactNode} children - Dialog body content
 * @param {string} className - Additional CSS classes
 * @param {boolean} noPadding - Whether to remove default padding
 * @param {boolean} noAnimation - Whether to disable animation
 */
const DialogBodyWrapper = ({ 
  children, 
  className = '',
  noPadding = false,
  noAnimation = false
}) => {
  // Animation variants for the dialog content
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <DialogBody 
      className={`${noPadding ? 'p-0' : 'p-4 sm:p-6'} ${className}`}
    >
      {noAnimation ? (
        children
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </DialogBody>
  );
};

export default DialogBodyWrapper; 