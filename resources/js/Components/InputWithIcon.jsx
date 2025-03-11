import React from 'react';
import { Input } from '@material-tailwind/react';

/**
 * A standardized input component with icon for consistent UI across all pages.
 * 
 * @param {React.ReactNode} icon - Icon to display before the input
 * @param {string} placeholder - Input placeholder text
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {function} onKeyDown - Key down handler
 * @param {string} type - Input type (default: 'text')
 * @param {string} className - Additional CSS classes
 * @param {Object} inputProps - Additional props for the input element
 * @param {Object} containerProps - Additional props for the container element
 */
const InputWithIcon = ({
  icon,
  placeholder,
  value,
  onChange,
  onKeyDown,
  type = 'text',
  className = '',
  inputProps = {},
  containerProps = {},
  ...rest
}) => {
  return (
    <div className={`relative w-full ${className}`} {...containerProps}>
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        </div>
      )}
      <Input
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`${icon ? 'pl-10' : 'pl-3'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg py-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400`}
        containerProps={{
          className: "min-w-[100px]"
        }}
        {...inputProps}
        {...rest}
      />
    </div>
  );
};

export default InputWithIcon; 