import React from 'react';

const Select = ({ 
    value, 
    onChange, 
    children, 
    disabled = false, 
    className = '',
    ...props 
}) => {
    return (
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`
                block w-full px-3 py-2 text-base
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                ${className}
            `}
            {...props}
        >
            {children}
        </select>
    );
};

export default Select; 