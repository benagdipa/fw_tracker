import React, { useRef } from 'react';

const FileInput = ({ 
    label, 
    accept, 
    onChange, 
    disabled = false, 
    className = '',
    ...props 
}) => {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={handleClick}
                disabled={disabled}
                className={`
                    w-full px-4 py-2 border-2 border-dashed rounded-lg
                    ${disabled 
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-500'
                    }
                    transition-colors duration-200
                `}
            >
                <div className="flex flex-col items-center justify-center space-y-2">
                    <svg 
                        className="w-6 h-6" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    <span className="text-sm font-medium">
                        {label || 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500">
                        {accept?.split(',').join(', ') || 'Any file type'}
                    </span>
                </div>
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={onChange}
                disabled={disabled}
                className="hidden"
                {...props}
            />
        </div>
    );
};

export default FileInput; 