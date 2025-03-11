import React, { useState } from 'react'
import { Button, Popover, PopoverContent, PopoverHandler, Typography } from '@material-tailwind/react'
import { Trash2Icon } from 'lucide-react'
import { router, useForm, usePage } from '@inertiajs/react';


export default function DeleteButton({ valueId }) {

    const { slug } = usePage().props?.entity
    const { processing, delete: destroy } = useForm()
    const [openPopover, setOpenPopover] = useState(false);
    const triggers = { onClick: () => setOpenPopover(!openPopover) };

    const onDeleteHandle = () => {
        if (valueId) {
            destroy(route('table.delete.row', valueId), {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('view.table.item', slug));
                },

            })
        }

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
                        <Button variant='text' color='red' size='sm' className='capitalize rounded' onClick={() => setOpenPopover(false)} disabled={processing}>Cancel</Button>
                        <Button variant='gradient' color='red' size='sm' className='capitalize rounded' onClick={onDeleteHandle} loading={processing}>Delete</Button>
                    </div>
                </PopoverContent>
            </Popover>

        </React.Fragment>
    )
}
