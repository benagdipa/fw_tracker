import React from 'react'
import { Button, Checkbox, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from '@material-tailwind/react'
import { useForm } from '@inertiajs/react';

export default function HideColumn({ hideColumnDialog, setHideColumnDialog, columns }) {
    const handleOpen = () => setHideColumnDialog(!hideColumnDialog);
    const { data, setData, post, processing, errors, reset } = useForm({
        items: [],
        unHiddenItems: [],
    })

    const onCheckboxChangeHandler = (e) => {
        const { value, checked } = e.target
        if (checked) {
            setData(prevData => {
                return {
                    ...prevData,
                    items: [...prevData.items, parseInt(value)]
                };
            });
            setData(prevData => {
                return {
                    ...prevData,
                    unHiddenItems: prevData.unHiddenItems.filter(item => item !== parseInt(value))
                };
            });
        } else {
            setData(prevData => {
                return {
                    ...prevData,
                    items: prevData.items.filter(item => item !== parseInt(value))
                };
            });
            setData(prevData => {
                return {
                    ...prevData,
                    unHiddenItems: [...prevData.unHiddenItems, parseInt(value)]
                };
            });
        }
    }

    const onSubmitHandler = (e) => {
        e.preventDefault();
        post(route('table.hide.column'), {
            onSuccess: () => {
                setHideColumnDialog(false)
                reset()
            }
        })
    }


    return (
        <>
            <Dialog open={hideColumnDialog} size='xs'>
                <DialogHeader>Hide Column</DialogHeader>
                <DialogBody>
                    <div className="form-item">
                        <p className='text-[#333] font-semibold'>Please select the column you want to hide</p>
                        <div className="form-item grid grid-cols-2">
                            {columns?.length > 0 && columns.map((item, index) => (
                                <React.Fragment key={index}>
                                    <Checkbox
                                        label={<Typography color="blue-gray" className="font-medium text-sm">{item?.name}</Typography>}
                                        value={item?.id}
                                        onChange={(e) => onCheckboxChangeHandler(e)}
                                        defaultChecked={item?.hidden}
                                    />
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="text" color="red" onClick={handleOpen} className="mr-1 capitalize">
                        <span>Cancel</span>
                    </Button>
                    <Button variant="gradient" color="green" className='capitalize' onClick={(e) => { onSubmitHandler(e) }} loading={processing}>
                        <span>Confirm</span>
                    </Button>
                </DialogFooter>
            </Dialog>
        </>
    )
}
