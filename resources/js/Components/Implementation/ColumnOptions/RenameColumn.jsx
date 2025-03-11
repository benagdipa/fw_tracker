import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from '@material-tailwind/react'
import React, { useEffect } from 'react'
import TextInput from '@/Components/TextInput'
import { useForm } from '@inertiajs/react'

export default function RenameColumn({ renameColumnDialog, setRenameColumnDialog, columns, deleted_columns }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type: "fw_site",
        key: 'rename',
        items: []
    })

    useEffect(() => {
        if (renameColumnDialog) {
            setData(prevData => {
                const newItems = [
                    ...columns.filter(item => !deleted_columns.includes(item.key)).map(item => ({ key: item.key, name: item.name })),
                ];
                return {
                    ...prevData,
                    items: newItems
                };
            })
        }
    }, [renameColumnDialog])

    const onChangeHandler = (key, value) => {
        setData(prevData => {
            return {
                ...prevData,
                items: prevData.items.map(item => {
                    if (item.key === key) {
                        return {
                            ...item,
                            name: value
                        }
                    } else {
                        return item
                    }
                })
            }
        })
    }

    const onSubmitHandler = (e) => {
        e.preventDefault();
        post(route('rename.columns.item'), {
            onSuccess: () => {
                setRenameColumnDialog(false)
                reset()
            }
        })
    }

    return (
        <Dialog open={renameColumnDialog} size='xs'>
            <DialogHeader>Rename Columns</DialogHeader>
            <DialogBody className="max-h-[42rem] overflow-scroll">
                <div className="grid grid-cols-2 gap-3">
                    {data?.items.length > 0 && data?.items?.map((item, index) => {
                        return (
                            <div className="form-item mb-2" key={index}>
                                <TextInput
                                    className='w-full text-sm font-medium text-gray-600'
                                    value={item?.name}
                                    onChange={(e) => onChangeHandler(item?.key, e.target.value)}
                                />
                            </div>
                        )
                    })}
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" className='mr-1 capitalize' onClick={() => setRenameColumnDialog(false)}>Cancel</Button>
                <Button variant="gradient" color="green" className='capitalize' onClick={(e) => onSubmitHandler(e)} loading={processing} >Submit</Button>
            </DialogFooter>
        </Dialog>
    )
}
