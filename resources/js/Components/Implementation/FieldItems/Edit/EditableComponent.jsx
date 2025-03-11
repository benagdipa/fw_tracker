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

export default function EditableComponent({ item, implementation, handleEditAbleItem }) {
    const FieldItem = fieldComponents[item['input_type']]
    const options = {
        category: [
            { label: 'Retunes', value: 'Retunes' },
            { label: 'Parameters', value: 'Parameters' },
            { label: 'ENDC_associations,nr-nr_associations', value: 'ENDC_associations,nr-nr_associations' },
        ],
        status: [
            { label: 'Planned', value: 'Planned' },
            { label: 'Done', value: 'Done' },
            { label: 'Done_With_Errors,Outstanding', value: 'Done_With_Errors,Outstanding' },
        ]
    }
    return (
        <FieldItem
            implementationId={implementation?.id}
            name={item.key}
            value={item.value}
            handleEditAbleItem={handleEditAbleItem}
            options={options[item.key]}
        />
    )
}
