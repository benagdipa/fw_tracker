import React, { useState } from 'react'
import DeleteButton from './DeleteButton';
import SaveButton from './SaveButton';
import TableColumn from './TableColumn';
import { useForm } from '@inertiajs/react';

export default function TableRow({ headers, values, valueId }) {

    const [changed, setChanged] = useState(false);
    const { data, setData, post } = useForm({
        changedItems: [...values]
    })

    function getColumnValue(data, key) {
        for (let i = 0; i < data.length; i++) {
            if (key in data[i]) {
                return data[i][key];
            }
        }
        return '';
    }
    function findIndex(slug, arrayItems) {
        for (let i = 0; i < arrayItems.length; i++) {
            if (slug in arrayItems[i]) {
                return i;
            }
        }
        return -1;
    }

    const handleItemChange = (slug, value) => {
        let changedItems = data.changedItems
        let itemIndex = findIndex(slug, changedItems);
        if (itemIndex !== -1) {
            changedItems[itemIndex][slug] = value;
            setData('changedItems', changedItems);
            setChanged(true);
        }
    }

    const handleOnSave = async () => {
        post(route('table.save.row', valueId), {
            onSuccess: () => {
                setChanged(false);
            }
        })
    }

    return (
        <React.Fragment>
            <tr className="even:bg-blue-gray-50/50">
                {headers.length && headers.map((header, index) => {
                    return (
                        <TableColumn
                            columnId={valueId}
                            key={index}
                            header={header}
                            itemValue={getColumnValue(values, header.slug)}
                            handleItemChange={handleItemChange}
                        />
                    )
                })}
                <td className='border-l h-10 text-[12px] font-medium ps-2'>
                    <div className="flex gap-1">
                        <SaveButton
                            changed={changed}
                            handleOnSave={handleOnSave}
                        />
                        <DeleteButton valueId={valueId} />
                    </div>
                </td>
            </tr>
        </React.Fragment>
    )
}

