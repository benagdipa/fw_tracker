import React, { useState } from 'react'
import EditableComponent from './FieldOptions/New/EditableComponent';
import { Button } from '@material-tailwind/react';
import { Trash2Icon } from 'lucide-react';
import { router, useForm, usePage } from '@inertiajs/react';

export default function AddNewRow({ tableHeader, setAddNewRow }) {
    const { entity } = usePage().props
    const { data, setData, post } = useForm({
        newItem: [],
        entity_id: entity?.id
    })
    const handleOnChangeItem = (name, value) => {
        setData('newItem', {
            ...data.newItem,
            [name]: value
        });
    };

    const handleOnSave = () => {
        post(route('table.add.row'), {
            onSuccess: () => {
                setAddNewRow(false)
                router.visit(route('view.table.item', entity?.slug));
            }
        })
    }


    return (
        <tr className='border-b'>
            {tableHeader?.length > 0 && tableHeader?.map((item, index) => (
                <td key={index} className='border-l h-10 text-[12px] font-medium ps-2'>
                    <EditableComponent
                        item={item}
                        handleOnChangeItem={handleOnChangeItem}
                    />
                </td>
            ))}
            <td className='ps-2 border-l'>
                <div className="flex gap-1">
                    <Button variant='gradient' size='sm' className='capitalize py-1 px-2 rounded font-semibold' onClick={handleOnSave}>Save</Button>
                    <Button variant='gradient' color='red' size='sm' className='capitalize py-1 px-2 rounded' onClick={() => setAddNewRow(false)}>
                        <Trash2Icon size={14} />
                    </Button>
                </div>

            </td>
        </tr>
    )
}
