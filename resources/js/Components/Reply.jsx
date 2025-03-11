import { useForm } from '@inertiajs/react';
import { Button, Collapse, Typography } from '@material-tailwind/react';
import React, { useState } from 'react'
import InputError from './InputError';

export default function Reply({ issueId }) {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => setOpen((cur) => !cur);
    const { data, setData, post, processing, errors, reset, delete: destroy } = useForm({
        issue_id: issueId,
        comment_content: '',
    });
    const formSubmit = (e) => {
        e.preventDefault();
        post(route('issues.comment.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false)
            }
        })
    }
    return (
        <div className='mt-3 px-6'>
            <Typography
                onClick={toggleOpen}
                className='font-medium text-sm text-gray-500 w-max cursor-pointer'
            >
                Add a comment
            </Typography>
            <Collapse open={open}>
                <form className='mt-3'>
                    <div className="form-item mb-4">
                        <textarea
                            className="w-full font-normal text-gray-700 border-gray-300 rounded-md shadow-sm focus:ring-0 focus:border-gray-500"
                            placeholder="Your Comment..."
                            rows={6}
                            value={data.comment_content}
                            onChange={(e) => setData('comment_content', e.target.value)}
                        />
                        <InputError message={errors.comment_content} className='mt-2' />
                    </div>
                    <div className="form-item mb-4 text-right">
                        <Button
                            variant="gradient"
                            color="green"
                            loading={processing}
                            onClick={formSubmit}
                        >
                            <span>Submit</span>
                        </Button>
                    </div>
                </form>
            </Collapse>
        </div>
    )
}
