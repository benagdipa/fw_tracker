import React, { useState } from 'react'
import { Button, Menu, MenuHandler, MenuItem, MenuList } from '@material-tailwind/react'
import AddColumn from '@/Components/Table/ColumnOptions/AddColumn'
import HideColumn from '@/Components/Table/ColumnOptions/HideColumn'
import RenameColumn from '@/Components/Table/ColumnOptions/RenameColumn'
import DeleteColumn from '@/Components/Table/ColumnOptions/DeleteColumn'
import RearrangeColumn from '@/Components/Table/ColumnOptions/RearrangeColumn'

export default function ColumnOptions({ columns }) {

    const [addColumnDialog, setAddColumnDialog] = useState(false)
    const [hideColumnDialog, setHideColumnDialog] = useState(false)
    const [renameColumnDialog, setRenameColumnDialog] = useState(false);
    const [deleteColumnDialog, setDeleteColumnDialog] = useState(false)
    const [arrangeColumnDialog, setArrangeColumnDialog] = useState(false)

    return (
        <>
            <Menu>
                <MenuHandler>
                    <Button variant='gradient' size='sm' className='capitalize'>Column Options</Button>
                </MenuHandler>
                <MenuList className='font-semibold text-gray-600'>
                    <MenuItem onClick={() => { setAddColumnDialog(true) }}>Add Column</MenuItem>
                    <MenuItem onClick={() => { setHideColumnDialog(true) }}>Show/Hide Columns</MenuItem>
                    <MenuItem onClick={() => { setRenameColumnDialog(true) }}>Rename Columns</MenuItem>
                    <MenuItem onClick={() => { setArrangeColumnDialog(true) }}>Rearrange Columns</MenuItem>
                    <MenuItem className='text-red-500' onClick={() => { setDeleteColumnDialog(true) }}>Delete Columns</MenuItem>
                </MenuList>
            </Menu>
            <AddColumn
                addColumnDialog={addColumnDialog}
                setAddColumnDialog={setAddColumnDialog}
            />
            <HideColumn
                columns={columns}
                hideColumnDialog={hideColumnDialog}
                setHideColumnDialog={setHideColumnDialog}
            />
            <RenameColumn
                renameColumnDialog={renameColumnDialog}
                setRenameColumnDialog={setRenameColumnDialog}
                columns={columns}
            />
            <DeleteColumn
                deleteColumnDialog={deleteColumnDialog}
                setDeleteColumnDialog={setDeleteColumnDialog}
                columns={columns}
            />
            <RearrangeColumn
                arrangeColumnDialog={arrangeColumnDialog}
                setArrangeColumnDialog={setArrangeColumnDialog}
                columns={columns}
            />
        </>
    )
}
