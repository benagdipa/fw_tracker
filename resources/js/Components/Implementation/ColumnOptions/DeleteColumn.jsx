import React, { useEffect, useState } from 'react'
import { useForm } from '@inertiajs/react'
import { Button, Checkbox, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from '@material-tailwind/react'

export default function DeleteColumn({ deleteColumnDialog, setDeleteColumnDialog, columns, deleted_columns }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        type: "implementation_tracker",
        key: 'delete',
        items: []
    })

    const [items, setItems] = useState([])
    useEffect(() => {
        if (deleteColumnDialog) {
            setItems(prevData => {
                const newItems = [
                    ...columns.filter(item => !deleted_columns.includes(item.key)).map(item => ({ key: item.key, name: item.name })),
                ];
                return newItems;
            })
        }
    }, [deleteColumnDialog])

    const onCheckboxChangeHandler = (e, key) => {
        const isChecked = e.target.checked;
        setData(prevData => {
            if (isChecked) {
                return {
                    ...prevData,
                    items: [...prevData.items, key]
                };
            } else {
                return {
                    ...prevData,
                    items: prevData.items.filter(item => item !== key)
                };
            }
        });
    }

    const onSubmitHandler = (e) => {
        e.preventDefault();
        post(route('delete.columns.item'), {
            onSuccess: () => {
                setDeleteColumnDialog(false)
                reset()
            }
        })
    }

    return (
        <Dialog open={deleteColumnDialog} size='xs'>
            <DialogHeader>Delete Columns</DialogHeader>
            <DialogBody className="max-h-[42rem] overflow-scroll">
                <div className="form-item">
                    <p className='text-[#333] font-semibold'>Please select the column you want to delete.</p>
                    <div className="grid grid-cols-2">
                        {items?.length > 0 && items.map((column, index) => {
                            return (
                                <React.Fragment key={index}>
                                    <Checkbox
                                        containerProps={{ className: 'py-3', }}
                                        className='w-5 h-5 rounded-md'
                                        label={<Typography color="blue-gray" className="font-medium text-sm">{column?.name}</Typography>}
                                        onChange={(e) => { onCheckboxChangeHandler(e, column?.key) }}
                                    />
                                </React.Fragment>
                            )
                        })}
                    </div>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" className='mr-1 capitalize' onClick={() => setDeleteColumnDialog(false)}>Cancel</Button>
                <Button variant="gradient" color="green" className='capitalize' onClick={(e) => { onSubmitHandler(e) }} loading={processing} >Submit</Button>
            </DialogFooter>
        </Dialog>
    )
}
