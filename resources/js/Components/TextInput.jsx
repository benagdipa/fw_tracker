import React, { forwardRef, useEffect, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref
) {
    const input = ref ? ref : useRef();

    useEffect(() => {
        if (isFocused) {
            input.current.focus();
        }
    }, []);

    return (
        <input
            {...props}
            type={type}
            className={
                `w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 py-2.5 px-3 text-sm transition-colors duration-200 ease-in-out ${
                    props.disabled ? 'bg-gray-100 opacity-70' : 'bg-white'
                } ${
                    props.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20' : ''
                } ` + className
            }
            ref={input}
        />
    );
});
