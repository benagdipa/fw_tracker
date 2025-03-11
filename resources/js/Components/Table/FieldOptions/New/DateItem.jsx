import React, { useState } from 'react'
import ReactDatePicker from 'react-datepicker';

export default function DateItem({ headerSlug, handleOnChangeItem }) {

    const [item, setItem] = useState('');

    const handleOnChange = (dateString) => {
        setItem(dateString)
        handleOnChangeItem(headerSlug, dateString)
    }

    return (
        <div className='w-full h-full'>
            <ReactDatePicker
                showIcon
                selected={item}
                onChange={(date) => handleOnChange(date)}
                className='border-none focus:ring-0 w-full bg-transparent !shadow-none text-[12px] font-medium'
                dateFormat="dd/MM/yyyy"
            />
        </div>
    )
}
