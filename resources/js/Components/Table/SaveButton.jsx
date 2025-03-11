import React from 'react'
import { Button } from '@material-tailwind/react'

export default function SaveButton({ changed, handleOnSave }) {
    return (
        <Button
            variant='gradient'
            size='sm'
            className='capitalize py-1 px-2 rounded font-semibold'
            disabled={!changed}
            onClick={handleOnSave}
        >
            Save
        </Button>
    )
}
