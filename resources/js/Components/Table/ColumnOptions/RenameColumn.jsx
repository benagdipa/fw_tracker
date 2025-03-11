import React from 'react'
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from '@material-tailwind/react'
import TextInput from '@/Components/TextInput'
import { useForm } from '@inertiajs/react'

export default function RenameColumn({ renameColumnDialog, setRenameColumnDialog, columns }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        items: columns
    })

    const onChangeHandler = (slug, value) => {
        setData(prevData => {
            return {
                ...prevData,
                items: prevData.items.map(item => {
                    if (item.slug === slug) {
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
        post(route('table.rename.column'), {
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
                    {data?.items?.length > 0 && data?.items?.map((item, index) => {
                        return (
                            <div className="form-item mb-2" key={index} >
                                <TextInput
                                    className='w-full text-sm font-medium text-gray-600'
                                    value={item?.alternative_name ? item?.alternative_name : item?.name}
                                    onChange={(e) => onChangeHandler(item?.slug, e.target.value)}
                                />
                            </div>
                        )
                    })}
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" className='mr-1 capitalize' onClick={() => setRenameColumnDialog(false)}>Cancel</Button>
                <Button variant="gradient" color="green" className='capitalize' onClick={(e) => onSubmitHandler(e)} loading={processing}>Submit</Button>
            </DialogFooter>
        </Dialog>
    )
}
