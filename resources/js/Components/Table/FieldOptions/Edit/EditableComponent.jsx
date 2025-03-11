import React from 'react'
import InputItem from './InputItem'
import DateItem from './DateItem'
import SelectItem from './SelectItem'
import UploadItem from './UploadItem'

const fieldComponents = {
    text: InputItem,
    date: DateItem,
    dropdown: SelectItem,
    upload: UploadItem
}

export default function EditableComponent({ header, itemValue, handleItemChange, columnId }) {
    const FieldItem = fieldComponents[header?.input_type]
    return (
        <React.Fragment>
            <FieldItem
                value={itemValue}
                handleItemChange={handleItemChange}
                headerSlug={header.slug}
                options={header?.input_options}
                columnId={columnId}
            />
        </React.Fragment>
    )
}
