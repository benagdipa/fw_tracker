import React from 'react'
import { Button, Dialog, DialogBody, DialogFooter, Typography, } from "@material-tailwind/react";
import { router, useForm } from '@inertiajs/react';


export default function DeleteTable({ deleteTableDialog, setDeleteTableDialog, tableId }) {
    const { processing, delete: destroy } = useForm()

    const onDeleteHandle = () => {
        if (tableId) {
            destroy(route('table.delete', tableId), {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('dashboard'))
                },
            })
        }
    }

    return (
        <>
            <Dialog open={deleteTableDialog} size='xs' className='rounded py-5'>
                <DialogBody>
                    <Typography variant='h4' className='text-center' color='black'>Are you sure?</Typography>
                    <p className='font-medium text-center' >This step is permanent and cannot be undone.</p>
                </DialogBody>
                <DialogFooter className='justify-center'>
                    <Button variant="gradient" className="mr-1" onClick={() => { setDeleteTableDialog(false) }} disabled={processing}>
                        <span>Cancel</span>
                    </Button>
                    <Button variant="gradient" color="red" onClick={onDeleteHandle} loading={processing}>
                        <span>Confirm</span>
                    </Button>
                </DialogFooter>
            </Dialog>
        </>
    )
}
