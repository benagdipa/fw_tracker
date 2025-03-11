import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import Authenticated from '@/Layouts/AuthenticatedLayout'
import { Button, Checkbox, Typography } from '@material-tailwind/react'
import { v4 as uuidv4 } from 'uuid';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { PlusIcon, XIcon } from 'lucide-react';
import InputError from '@/Components/InputError';

export default function ColumnIndex({ auth, table }) {

    const { data, setData, post, processing, errors } = useForm({
        table_id: table?.id,
        table_slug: table?.slug,
        items: [{
            id: uuidv4(),
            name: '',
            slug: '',
            position: 1,
            sortable: false,
            editable: false,
            input_type: '',
            options: []
        }]
    })

    const handleAddItem = () => {
        const newItem = {
            id: uuidv4(),
            name: '',
            slug: '',
            position: data.items.length + 1,
            sortable: false,
            editable: false,
            input_type: '',
            options: []
        };
        setData({ ...data, items: [...data.items, newItem] });
    };

    const handleRemoveItem = (id) => {
        const updatedItems = data?.items.filter(item => item.id !== id);
        setData({ ...data, items: updatedItems });
    };


    const handleInputChange = (id, ele, checkbox) => {
        const updatedItems = data.items.map((item) => {
            if (item.id === id) {
                const { name, value, checked } = ele.target;
                if (checkbox) {
                    return { ...item, [name]: checked };
                }
                return { ...item, [name]: value };
            }
            return item;
        });
        setData('items', updatedItems);
    };


    const onSubmitHandle = () => {
        console.log(data);
        post(route('table.wizard.column.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset()
            }
        })
    }
    return (
        <Authenticated user={auth?.user}>
            <Head title="Table Wizard" />
            <div className="top-section p-4">
                <div className='flex items-center justify-between'>
                    <div className="left">
                        <Typography variant={'h3'} className='tracking-tight'>Self Service Table Wizard</Typography>
                        <ul className='flex gap-1 text-gray-600 text-sm'>
                            <li><Link href={route('dashboard')}>Dashboard</Link></li>
                            <li>/</li>
                            <li><Link href={route('table.wizard.index')}>Self Service Table Wizard</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="content mt-6 relative border-t">
                <div className="container mx-auto pt-12">
                    <Typography variant='h2' color={"gray"} > Add Columns for  {table?.title}.</Typography>
                    <div className="column-items mb-6">
                        {data?.items.map((item, index) => (
                            <div className="grid grid-cols-4 gap-4 relative mt-6 border p-4 rounded-md" key={index}>
                                <div className="form-item">
                                    <InputLabel value={'Column Name'} className='mb-1' />
                                    <TextInput className='w-full text-sm' value={item.name} name={'name'} onChange={(e) => { handleInputChange(item.id, e, false) }} />
                                    <InputError message={errors[`items.${index}.name`]} className='mt-1 font-medium tracking-tight' />
                                </div>
                                <div className="form-item">
                                    <InputLabel value={'Column Slug'} className='mb-1' />
                                    <TextInput className='w-full text-sm' value={item.slug} name={'slug'} onChange={(e) => { handleInputChange(item.id, e, false) }} />
                                    <InputError message={errors[`items.${index}.slug`]} className='mt-1 font-medium tracking-tight' />
                                </div>
                                <div className="col-span-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex gap-4 justify-evenly">
                                            <div className="form-item">
                                                <InputLabel value={'Sortable'} className='mb-1' />
                                                <Checkbox defaultChecked={item?.sortable} className="h-6 w-6" name='sortable' onChange={(e) => { handleInputChange(item.id, e, true) }} />
                                            </div>
                                            <div className="form-item">
                                                <InputLabel value={'Editable'} className='mb-1' />
                                                <Checkbox defaultChecked={item?.editable} className="h-6 w-6" name='editable' onChange={(e) => { handleInputChange(item.id, e, true) }} />
                                            </div>
                                        </div>
                                        {item.editable && (
                                            <div className="form-item">
                                                <InputLabel value={'Input Type'} className='mb-1' />
                                                <select className='w-full text-sm rounded-md border-gray-300 text-gray-500 font-normal' value={item?.input_type} name={'input_type'} onChange={(e) => { handleInputChange(item.id, e, false) }}>
                                                    <option value="">Select</option>
                                                    <option value="text">Text</option>
                                                    <option value="date">Date</option>
                                                    <option value="dropdown">Dropdown</option>
                                                    <option value="upload">Upload</option>
                                                </select>
                                                <InputError message={errors[`items.${index}.input_type`]} className='mt-1 font-medium tracking-tight' />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {item.input_type === 'dropdown' && (
                                    <div className="form-item col-span-4">
                                        <InputLabel value={'Options seprated by (|)'} className='mb-1' />
                                        <textarea className='w-full border-gray-300 rounded-md text-sm' rows={6} value={item?.options} name={'options'} onChange={(e) => { handleInputChange(item.id, e, false) }} />
                                        <InputError message={errors[`items.${index}.options`]} className='mt-1 font-medium tracking-tight' />
                                    </div>
                                )}
                                <div className="add-icon absolute -right-10 top-6">
                                    {index === data?.items.length - 1 ? (<button onClick={handleAddItem}><PlusIcon /></button>) : (<button onClick={() => { handleRemoveItem(item.id) }}><XIcon /></button>)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="form-item flex justify-end">
                        <Button variant='gradient' color="green" onClick={onSubmitHandle} className='capitalize' loading={processing}>
                            Submit
                        </Button>
                    </div>
                </div>
            </div>

        </Authenticated>
    )
}
