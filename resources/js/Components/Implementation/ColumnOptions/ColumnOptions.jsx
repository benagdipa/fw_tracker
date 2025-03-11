import React, { useState } from "react";
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Button,
} from "@material-tailwind/react";
import AddColumn from "@/Components/Implementation/ColumnOptions/AddColumn";
import HideColumn from "@/Components/Implementation/ColumnOptions/HideColumn";
import RenameColumn from "@/Components/Implementation/ColumnOptions/RenameColumn";
import DeleteColumn from "@/Components/Implementation/ColumnOptions/DeleteColumn";
import RearrangeColumn from "@/Components/Implementation/ColumnOptions/RearrangeColumn";

export default function ColumnOptions({
  columns,
  hidden_columns,
  deleted_columns,
  hideColumnDialog,
  setHideColumnDialog
}) {
  const [addColumnDialog, setAddColumnDialog] = useState(false);
  // const [hideColumnDialog, setHideColumnDialog] = useState(false)
  const [renameColumnDialog, setRenameColumnDialog] = useState(false);
  const [deleteColumnDialog, setDeleteColumnDialog] = useState(false);
  const [arrangeColumnDialog, setArrangeColumnDialog] = useState(false);
  return (
    <>
      <Button
        size="sm"
        className="capitalize rounded text-sm"
        style={{ backgroundColor: '#0057B8', color: 'white', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
        onClick={() => {
            setAddColumnDialog(true);
        }}
      >
        Add New Column
    </Button>
      {/* <Menu>
                <MenuHandler>
                    <Button variant='gradient' size='sm' className='capitalize'>Column Options</Button>
                </MenuHandler>
                <MenuList className='font-semibold text-gray-600'>
                    <MenuItem onClick={() => { setAddColumnDialog(true) }}>Add Column</MenuItem>
                    <MenuItem onClick={() => { setHideColumnDialog(true) }}>Show/Hide Columns</MenuItem>
                    <MenuItem onClick={() => { setRenameColumnDialog(true) }}>Rename Columns</MenuItem>
                    <MenuItem onClick={() => { setArrangeColumnDialog(true) }}>Rearrange Columns</MenuItem>
                    <MenuItem onClick={() => { setDeleteColumnDialog(true) }} className='text-red-500'>Delete Columns</MenuItem>
                </MenuList>
            </Menu> */}
      <AddColumn
        addColumnDialog={addColumnDialog}
        setAddColumnDialog={setAddColumnDialog}
      />
      <HideColumn
        hideColumnDialog={hideColumnDialog}
        setHideColumnDialog={setHideColumnDialog}
        columns={columns}
        hidden_columns={hidden_columns}
        deleted_columns={deleted_columns}
      />
      <RenameColumn
        renameColumnDialog={renameColumnDialog}
        setRenameColumnDialog={setRenameColumnDialog}
        columns={columns}
        deleted_columns={deleted_columns}
      />
      <DeleteColumn
        deleteColumnDialog={deleteColumnDialog}
        setDeleteColumnDialog={setDeleteColumnDialog}
        columns={columns}
        deleted_columns={deleted_columns}
      />
      <RearrangeColumn
        arrangeColumnDialog={arrangeColumnDialog}
        setArrangeColumnDialog={setArrangeColumnDialog}
        columns={columns}
        deleted_columns={deleted_columns}
      />
    </>
  );
}
