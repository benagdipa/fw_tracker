import React from 'react'
import { Button } from '@material-tailwind/react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux';
import axios from 'axios';

export default function SaveBtn(props) {
    const {changedDataFW} = useSelector(state => state.table);
    
    const handleSave = async () => {
        // Check if changedDataFW exists and has data for this row
        if (changedDataFW && typeof changedDataFW === 'object' && changedDataFW[props.data.id]) {
            const rowData = changedDataFW[props.data.id];
            try {
                const res = await axios.post(route('implementation.field.name.save.item'), {
                    id: props.data.id,
                    ...rowData
                });
                toast.success('Changes saved successfully');
            } catch (error) {
                console.error('Save error:', error);
                toast.error('Failed to save changes');
            }
        }
    }
    
    return (
        <Button
            size='sm'
            className='capitalize py-1 px-2 rounded font-semibold'
            disabled={!changedDataFW || !changedDataFW[props.data.id]}
            onClick={handleSave}
            color='blue'
        >
            Save
        </Button>
    )
}
