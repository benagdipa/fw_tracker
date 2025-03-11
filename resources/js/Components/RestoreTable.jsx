import { useForm } from '@inertiajs/react';
import { Button } from '@material-tailwind/react'
import React from 'react'

export default function RestoreTable({ type }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        table_type: type
    })


    const handleTableRestore = () => {
        if (type) {
            post(route('restore.table'), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                }
            })
        }
    }
    return (
        <div className="restore-table">
            <Button variant='gradient' size='sm' className='capitalize' onClick={handleTableRestore} loading={processing}>Restore Table</Button>
        </div>
    )
}
