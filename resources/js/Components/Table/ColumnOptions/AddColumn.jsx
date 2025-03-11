import React from 'react'
import { Button, Checkbox, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from '@material-tailwind/react'
import { useForm, usePage } from '@inertiajs/react'
import InputLabel from '@/Components/InputLabel'
import InputError from '@/Components/InputError'
import TextInput from '@/Components/TextInput'

export default function AddColumn({ addColumnDialog, setAddColumnDialog }) {

    const { id: entity_id } = usePage().props?.entity

    const { data, setData, post, processing, errors, reset } = useForm({
        entity_id: entity_id,
        name: '',
        slug: '',
        sortable: false,
        editable: false,
        input_type: '',
        options: '',
    })

    const submitHandler = (e) => {
        e.preventDefault()
        post(route('table.add.column'), {
            onSuccess: () => {
                setAddColumnDialog(false)
                reset()
            }
        })
    }
    return (
        <Dialog open={addColumnDialog} size='xs'>
            <DialogHeader>Add New Column</DialogHeader>
            <DialogBody>
                <div className="form-item mb-4">
                    <InputLabel value={'Column Name'} className='mb-1' />
                    <TextInput
                        className='w-full text-sm font-medium text-gray-600'
                        placeholder='Column Name...'
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    <InputError message={errors.name} className='text-sm font-medium' />
                </div>
                <div className="form-item mb-4">
                    <InputLabel value={'Column Slug'} className='mb-1' />
                    <TextInput
                        className='w-full text-sm font-medium text-gray-600'
                        placeholder='Column slug...'
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                    />
                    <InputError message={errors.slug} className='text-sm font-medium' />
                </div>

                <div className="form-item">
                    <Checkbox
                        label={<Typography className='text-sm font-medium pl-2'>Sortable</Typography>}
                        defaultChecked={data.sortable}
                        onChange={(e) => setData('sortable', e.target.checked)}
                    />
                </div>
                <div className="form-item">
                    <Checkbox
                        label={<Typography className='text-sm font-medium pl-2'>Editable</Typography>}
                        defaultChecked={data.editable}
                        onChange={(e) => setData('editable', e.target.checked)}
                    />
                </div>
                {data?.editable && (
                    <div className="form-item mb-4">
                        <InputLabel value={'Column Input Type'} className='mb-1' />
                        <select
                            className='w-full rounded text-sm border-gray-300 shadow-sm font-medium text-gray-600 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600'
                            value={data.input_type}
                            onChange={(e) => setData('input_type', e.target.value)}
                        >
                            <option value="">Select</option>
                            <option value="text">Text</option>
                            <option value="date">Date</option>
                            <option value="dropdown">DropDown</option>
                        </select>
                        <InputError message={errors.input_type} className='text-sm font-medium' />
                    </div>
                )}
                {data?.input_type === 'dropdown' && (
                    <div className="form-item mb-4">
                        <InputLabel value={'Dropdown Options seprated by (|)'} className='mb-1' />
                        <textarea
                            className='w-full rounded text-sm border-gray-300 shadow-sm font-normal focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600'
                            placeholder='Dropdown Options seprated by | ...'
                            rows={4}
                            value={data.options}
                            onChange={(e) => setData('options', e.target.value)}
                        />
                        <InputError message={errors.options} className='text-sm font-medium' />
                    </div>
                )}
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" onClick={() => setAddColumnDialog(!addColumnDialog)} className="mr-1 capitalize">
                    <span>Cancel</span>
                </Button>
                <Button variant="gradient" color="green" onClick={(e) => submitHandler(e)} className='capitalize' loading={processing}>
                    <span>Submit</span>
                </Button>
            </DialogFooter>
        </Dialog>
    )
}
