import { Typography } from '@material-tailwind/react';
import React from 'react'

export default function Comment({ comment }) {
    return (
        <div className='py-3 border-t px-4'>
            <Typography className='font-normal text-[14px]' color='blue-gray'>{comment?.comment_content} - <span className='text-blue-800 font-medium'>{comment?.user.name}</span></Typography>
        </div>
    )
}
