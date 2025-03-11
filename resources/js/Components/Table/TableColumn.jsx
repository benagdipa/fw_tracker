import React from 'react'
import EditableComponent from './FieldOptions/Edit/EditableComponent'

export default function TableColumn({ columnId, header, itemValue, handleItemChange }) {
    return (
        <React.Fragment>
            <td className={`border-l h-10 text-[12px] font-medium ps-2 ${header?.hidden ? 'hidden' : ''}`}>
                {header?.editable ?
                    <EditableComponent
                        header={header}
                        itemValue={itemValue}
                        handleItemChange={handleItemChange}
                        columnId={columnId}
                    />
                    : itemValue
                }
            </td>
        </React.Fragment>
    )
}
