import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from '@material-tailwind/react'
import { MoveIcon } from 'lucide-react'
import { useForm } from '@inertiajs/react'

export default function RearrangeColumn({ arrangeColumnDialog, setArrangeColumnDialog, columns, deleted_columns }) {

    const [items, setItems] = useState([])
    const [draggingItem, setDraggingItem] = useState(null)

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'wntd',
        key: 'arrange',
        items: []
    })

    useEffect(() => {
        if (arrangeColumnDialog) {
            setItems(prevData => {
                const addPosition = (array) => {
                    return array.map((item, index) => {
                        return { ...item, position: index + 1 };
                    });
                };

                const newItems = [
                    ...addPosition(columns
                        .filter(item => !deleted_columns.includes(item.key))
                        .map(item => ({ key: item.key, name: item.name }))),
                ];
                return newItems;
            })
        }
    }, [arrangeColumnDialog])


    const handleDragStart = (e, item) => {
        setDraggingItem(item)
    };

    const handleDragEnd = () => {
        setDraggingItem(null)
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetItem) => {
        if (!draggingItem) return;

        const currentIndex = items.indexOf(draggingItem);
        const targetIndex = items.indexOf(targetItem);
        if (currentIndex !== -1 && targetIndex !== -1) {
            const addPosition = (array) => {
                return array.map((item, index) => {
                    return { ...item, position: index + 1 };
                });
            };
            const updatedItems = [...addPosition(items)];
            const [removedItem] = updatedItems.splice(currentIndex, 1);
            updatedItems.splice(targetIndex, 0, removedItem);
            const updatedItemsWithPositions = updatedItems.map((item, index) => ({
                ...item,
                position: index + 1
            }));
            setItems(updatedItemsWithPositions);
            const newState = updatedItemsWithPositions.map(item => ({
                key: item.key,
                position: item.position
            }));
            setData('items', newState)
        }
    };

    const onSubmitHandler = (e) => {
        e.preventDefault();
        post(route('rearrange.columns.item'), {
            onSuccess: () => {
                setArrangeColumnDialog(false)
                reset()
            }
        })
    }

    return (
        <Dialog open={arrangeColumnDialog} size='xs'>
            <DialogHeader>Re-arrange Columns</DialogHeader>
            <DialogBody className="max-h-[42rem] overflow-scroll">
                <p className='text-[#333] font-semibold mb-3'>Please drag and drop the column you want to arrange.</p>
                <div className="draggable-wrapper border rounded-md py-2">
                    {
                        items?.length > 0 && items?.map((item, index) => {
                            return (
                                <div
                                    className="text-gray-600 font-medium py-1 px-2 text-sm  cursor-move"
                                    key={index}
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, item)}
                                >
                                    <div className="flex items-center gap-3 border py-2 px-2 rounded-md ">
                                        <div className="icon-wrapper">
                                            <MoveIcon strokeWidth={1.5} size={18} />
                                        </div>
                                        {item.name}
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" className='mr-1 capitalize' onClick={() => setArrangeColumnDialog(false)} >cancel</Button>
                <Button variant="gradient" color="green" className='capitalize' onClick={(e) => onSubmitHandler(e)} loading={processing}>Submit</Button>
            </DialogFooter>
        </Dialog>
    )
}
