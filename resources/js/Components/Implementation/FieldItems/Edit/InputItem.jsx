import React, { useState } from 'react'

export default function InputItem({ siteId, name, value, handleEditAbleItem }) {

    const [item, setItem] = useState(value ? value : '');
    const uploadInputValue = (val) => {
        setItem(val);
        handleEditAbleItem(siteId, name, val)
    }

    return (
        <div className='w-full h-full'>
            <textarea
                className='border-none focus:ring-0 bg-transparent !shadow-none text-[12px] font-medium w-full'
                value={item}
                rows={1}
                onChange={(e) => { uploadInputValue(e.target.value) }}
            />
        </div>
    )
}
