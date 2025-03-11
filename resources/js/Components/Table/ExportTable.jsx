import React, { useState } from 'react'
import { Button } from '@material-tailwind/react'
import axios from 'axios'

export default function ExportTable({ entity_id }) {

    const [loading, setLoading] = useState(false)
    const handleExport = async () => {
        try {
            setLoading(true)
            const res = await axios.get(route('table.restore.column', entity_id))
            // dd(res)
            // const blob = new Blob([res.data], { type: 'text/csv' });
            // const url = window.URL.createObjectURL(blob);
            // const link = document.createElement('a');
            // link.href = url;
            // link.setAttribute('download', `${file_name}.csv`);
            // document.body.appendChild(link);
            // link.click();
            // document.body.removeChild(link);

        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="export">
            <Button variant="gradient" className='capitalize' size='sm' onClick={handleExport} loading={loading}>Export</Button>
        </div>
    )
}
