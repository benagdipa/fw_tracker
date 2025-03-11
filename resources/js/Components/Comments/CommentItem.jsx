import { Button, Typography } from '@material-tailwind/react';
import React from 'react'
import AddReply from '../Reply/AddReply';
import { MinusIcon } from 'lucide-react';
import ReplyItem from '../Reply/ReplyItem';
import { formatDistanceToNow, formatRelative } from 'date-fns';
import CommentReplyOptions from '../CommentReplyOptions';
import { usePage } from '@inertiajs/react';

export default function CommentItem({ comment }) {
    const { user } = usePage().props?.auth
    return (
        <div className='py-4 border-t px-6'>
            <div className="comment-container relative border p-2 rounded-md border-gray-200">
                <div className='text-gray-500 font-medium block text-[13px]'>@{comment?.user.name} - <span className='capitalize'>{formatRelative(new Date(comment?.created_at), new Date())}</span></div>
                <div className="font-normal text-blue-gray-900">{comment?.comment_content}</div>
                <AddReply commentId={comment?.id} userId={comment?.user?.id} />
                {user?.id === comment?.user?.id && (<CommentReplyOptions type="comment" itemId={comment?.id} />)}

            </div>
            {comment?.replies.length > 0 && (
                <ul className='border-l border-gray-200 pt-4 -mt-1'>
                    {comment?.replies.map((reply, index) => (
                        <ReplyItem
                            reply={reply}
                            key={index}
                            commentId={comment?.id}
                        />
                    ))}
                </ul>
            )}
        </div>
    )
}
