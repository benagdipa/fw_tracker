import React from 'react'
import AddReply from './AddReply'
import { formatRelative } from 'date-fns'
import CommentReplyOptions from '../CommentReplyOptions'
import { usePage } from '@inertiajs/react'

export default function ReplyItem({ reply, commentId }) {
    const { user } = usePage().props?.auth
    return (
        <li className='font-normal text-base text-blue-gray-900 mb-4 relative'>
            <span className='block w-6 h-1 border-b border-gray-200 absolute left-0 top-[7px]'></span>
            <div className='ms-6 reply-container relative border p-2 rounded-md border-gray-200'>
                <div className='text-gray-500 font-medium block text-[13px]'>@{reply?.user?.name} - <span className='capitalize'>{formatRelative(new Date(reply?.created_at), new Date())}</span></div>
                <div className="font-normal text-blue-gray-900">{reply?.body}</div>
                <AddReply commentId={commentId} parentId={reply?.id} userId={reply?.user?.id} />
                {user?.id === reply?.user?.id && (<CommentReplyOptions type="reply" itemId={reply?.id} />)}
            </div>

            {reply?.replies?.length > 0 && (
                <ul className='border-l border-gray-200 pt-4 ms-6 -mt-1'>
                    {reply?.replies.map((item, index) => (
                        <ReplyItem
                            reply={item}
                            key={index}
                            commentId={commentId}
                        />
                    ))}
                </ul>
            )}
        </li>
    )
}
