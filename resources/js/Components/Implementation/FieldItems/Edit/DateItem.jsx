import React, { useState } from 'react'
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function DateItem({ siteId, name, value, handleEditAbleItem }) {

    function isValidDate(stringDate) {
        return !isNaN(Date.parse(stringDate));
    }

    const [item, setItem] = useState(isValidDate(value) ? value : '');

    
    const handleOnChange = (dateString) => {
        setItem(dateString)
        handleEditAbleItem(siteId, name, dateString)
    }
    return (
        <div className='w-full h-full'>
            <ReactDatePicker
                selected={item}
                onChange={(date) => handleOnChange(date)}
                className='border-none focus:ring-0 w-full bg-transparent !shadow-none text-[12px] font-medium'
                dateFormat="dd/MM/yyyy"
            />
        </div>
    )
}
