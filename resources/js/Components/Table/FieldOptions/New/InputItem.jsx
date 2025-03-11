import React, { useState } from 'react'

export default function InputItem({ headerSlug, handleOnChangeItem }) {
    const [item, setItem] = useState('');

    const handleInputChange = (e) => {
        setItem(e.target.value);
        handleOnChangeItem(headerSlug, e.target.value)
    }

    return (
        <div className='w-full h-full'>
            <textarea
                className='border-none focus:ring-0 bg-transparent !shadow-none text-[12px] font-medium w-full resize-none'
                value={item}
                rows={1}
                autoFocus={true}
                onChange={(e) => { handleInputChange(e) }}
            />
        </div>
    )
}
