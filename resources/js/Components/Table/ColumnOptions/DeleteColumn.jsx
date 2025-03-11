import React from 'react'
import { Button, Checkbox, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from '@material-tailwind/react'
import { useForm } from '@inertiajs/react'


export default function DeleteColumn({ deleteColumnDialog, setDeleteColumnDialog, columns }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        items: []
    })
    const onCheckboxChangeHandler = (e, id) => {
        const isChecked = e.target.checked;
        setData(prevData => {
            if (isChecked) {
                return {
                    ...prevData,
                    items: [...prevData.items, id]
                };
            } else {
                return {
                    ...prevData,
                    items: prevData.items.filter(item => item !== id)
                };
            }
        });
    }

    const onSubmitHandler = (e) => {
        e.preventDefault();
        post(route('table.delete.column'), {
            onSuccess: () => {
                setDeleteColumnDialog(false)
                reset()
            }
        })
    }


    return (
        <Dialog size='xs' open={deleteColumnDialog}>
            <DialogHeader>Delete Columns</DialogHeader>
            <DialogBody className="max-h-[42rem] overflow-scroll">
                <div className="form-item">
                    <p className='text-[#333] font-semibold'>Please select the column you want to delete.</p>
                    <div className="grid grid-cols-2">
                        {columns?.length > 0 && columns.map((item, index) => {
                            return (
                                <React.Fragment key={index}>
                                    <Checkbox
                                        containerProps={{ className: 'py-3', }}
                                        className='w-5 h-5 rounded-md'
                                        label={<Typography color="blue-gray" className="font-medium text-sm">{item?.alternative_name ? item?.alternative_name : item?.name}</Typography>}
                                        onChange={(e) => { onCheckboxChangeHandler(e, item?.id) }}
                                    />
                                </React.Fragment>
                            )
                        })}
                    </div>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" onClick={() => setDeleteColumnDialog(false)}>Cancel</Button>
                <Button variant="text" color="red" onClick={(e) => onSubmitHandler(e)}>Delete</Button>
            </DialogFooter>
        </Dialog>
    )
}
