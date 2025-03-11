import React, { useRef, useState } from 'react'
import { Button } from '@material-tailwind/react'
import toast from 'react-hot-toast';
import CSVMapping from '@/Components/Table/CSVMapping';

export default function ImportCSV({ columns }) {
    const hiddenFileInput = useRef(null);
    const [mappingDialog, setMappingDialog] = useState(false)
    const [mappingData, setMappingData] = useState('')

    const handleClick = event => {
        hiddenFileInput.current.click();
    };

    const handleChangeUpload = async (event) => {
        const form_input = new FormData();
        form_input.append('import_file', event.target.files[0]);
        try {
            const res = await axios.post(route('table.import.csv'), form_input);
            if (res?.data) {
                setMappingData(res?.data)
                setMappingDialog(true)
            }
        } catch (error) {
            toast.error(`${error?.response?.data?.error?.message}`);
        }
    };
    return (
        <>
            <div className='import-type-field'>
                <Button variant="gradient" className='capitalize' size='sm' onClick={handleClick}>Import from CSV</Button>
                <input type="file" onChange={handleChangeUpload} ref={hiddenFileInput} style={{ display: 'none' }} />
            </div>
            <CSVMapping
                mappingDialog={mappingDialog}
                setMappingDialog={setMappingDialog}
                mappingData={mappingData}
                columns={columns}
            />
        </>
    )
}
