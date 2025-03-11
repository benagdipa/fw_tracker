import React, { useState } from 'react'

export default function InputItem({ name, handleItemOnChange }) {
    const [item, setItem] = useState('');
    const handleOnChange = (val) => {
        setItem(val);
        handleItemOnChange(name, val)
    }
    return (
        <div className='w-full h-full'>
            <textarea
                className='border-none focus:ring-0 bg-transparent !shadow-none text-[12px] font-medium w-full'
                rows={1}
                value={item}
                onChange={(e) => { handleOnChange(e.target.value) }}
            />
        </div>
    )
}
