import React, { useState } from 'react';

export default function SelectItem({ value, handleItemChange, headerSlug, options }) {

    const [item, setItem] = useState(value ? value : '');

    const uploadInputValue = (val) => {
        setItem(val);
        handleItemChange(headerSlug, val);
    }

    // Check if 'options' is a string and split it by '|' if necessary
    const selectOptions = Array.isArray(options) ? options : options?.split('|') || [];

    return (
        <div className='w-full h-full min-w-32'>
            <select
                value={item}
                onChange={(e) => { uploadInputValue(e.target.value) }}
                className='border-none focus:ring-0 w-full bg-transparent !shadow-none text-[12px] font-medium px-1'
            >
                <option value="">Select</option>
                {selectOptions?.length > 0 && selectOptions.map((option, index) => {
                    return <option key={index} value={option}>{option}</option>;
                })}
            </select>
        </div>
    )
}