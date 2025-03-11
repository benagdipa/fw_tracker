import React from 'react'
import InputItem from './InputItem'
import DateItem from './DateItem'
import SelectItem from './SelectItem'

const None = () => { return (<></>) }
const fieldComponents = {
    text: InputItem,
    date: DateItem,
    dropdown: SelectItem,
    none: None
}
export default function EditableComponent({ item, handleOnChangeItem }) {
    const FieldItem = fieldComponents[item?.input_type === 'upload' ? 'none' : item?.input_type]
    return (
        <FieldItem
            headerSlug={item.slug}
            options={item?.input_options}
            handleOnChangeItem={handleOnChangeItem}
        />
    )
}
