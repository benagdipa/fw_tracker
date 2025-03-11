import { Button, Collapse } from '@material-tailwind/react';
import React, { useState } from 'react'
import InputError from '../InputError';
import { useForm, usePage } from '@inertiajs/react';

export default function AddReply({ commentId, parentId = 0, userId }) {

    const [open, setOpen] = useState(false);
    const toggleOpen = () => setOpen((cur) => !cur);

    const { data, setData, post, processing, errors, reset, delete: destroy } = useForm({
        comment_id: commentId,
        parent_id: parentId,
        body: '',
    });
    const formSubmit = (e) => {
        e.preventDefault();

        post(route('issues.reply.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false)
            }
        })
    }
    return (
        <React.Fragment>
            <button
                className='px-0 capitalize text-gray-500 font-normal text-sm'
                onClick={toggleOpen}
            >
                Reply
            </button>

            <Collapse open={open}>
                <form className='mt-3'>
                    <div className="form-item mb-4">
                        <textarea
                            className="w-full font-normal text-gray-700 border-gray-300 rounded-md shadow-sm focus:ring-0 focus:border-gray-500 text-sm"
                            placeholder="Your Reply..."
                            rows={4}
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                        />
                        <InputError message={errors.body} className='mt-2' />
                    </div>
                    <div className="form-item mb-4 text-right">
                        <Button
                            variant="text"
                            color="red"
                            onClick={toggleOpen}
                            className="mr-1"
                        >
                            <span>Cancel</span>
                        </Button>
                        <Button
                            variant="gradient"
                            color="green"
                            size='sm'
                            loading={processing}
                            onClick={formSubmit}
                        >
                            <span>Reply</span>
                        </Button>
                    </div>
                </form>
            </Collapse>
        </React.Fragment>
    )
}
