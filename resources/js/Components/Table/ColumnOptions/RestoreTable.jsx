import { useForm } from '@inertiajs/react'
import { Button } from '@material-tailwind/react'
import React from 'react'

export default function RestoreTable({ entity_id }) {

    const { post, processing, reset } = useForm({
        entity_id: entity_id
    })
    const handleTableRestore = () => {
        if (entity_id) {
            post(route('table.restore.column'), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                }
            })
        }
    }
    return (
        <div className="restore-table">
            <Button variant='gradient' size='sm' className='capitalize' loading={processing} onClick={handleTableRestore}>Restore Table</Button>
        </div>
    )
}
