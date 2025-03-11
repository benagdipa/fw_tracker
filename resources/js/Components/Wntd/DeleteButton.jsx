import React, { useState } from 'react'
import { Button, Popover, PopoverContent, PopoverHandler, Typography } from '@material-tailwind/react'
import { Trash2Icon } from 'lucide-react'
import { router, useForm } from '@inertiajs/react';

export default function DeleteButton(props) {
    const { processing, delete: destroy } = useForm()
    const [openPopover, setOpenPopover] = useState(false);
    const triggers = {
        onMouseEnter: () => setOpenPopover(true),
        onMouseLeave: () => setOpenPopover(false),
    };

    const onDeleteHandle = () => {
        destroy(route('wireless.sites.destroy', props.data.id), {
            preserveScroll: true,
            onSuccess: () => {
                router.visit(route('wireless.sites.index'))
            },

        })
    }

    return (
        <React.Fragment>
            <Popover placement="top-end" open={openPopover} handler={setOpenPopover}>
                <PopoverHandler {...triggers}>
                    <Button variant='gradient' color='red' size='sm' className='capitalize py-1 px-2 rounded' onClick={() => setOpen(true)}>
                        <Trash2Icon size={14} />
                    </Button>
                </PopoverHandler>
                <PopoverContent {...triggers} className='px-3'>
                    <Typography variant='h6' className='text-center'>Are you sure?</Typography>
                    <Typography variant='small' className='font-normal'>This cannot be reverted back.</Typography>
                    <div className="mt-2 flex justify-between">
                        <Button variant='text' color='red' size='sm' className='capitalize rounded' onClick={() => setOpenPopover(false)}>Cancel</Button>
                        <Button variant='gradient' color='red' size='sm' className='capitalize rounded' onClick={onDeleteHandle}>Delete</Button>
                    </div>
                </PopoverContent>
            </Popover>

        </React.Fragment>
    )
}
