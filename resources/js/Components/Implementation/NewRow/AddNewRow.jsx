import React, { useMemo, useState } from 'react'
import { Button } from '@material-tailwind/react'
import { Trash2Icon } from 'lucide-react'
import { router } from '@inertiajs/react'
import toast from 'react-hot-toast'
import EditableComponent from '../FieldItems/New/EditableComponent'
import { DataGrid } from '@mui/x-data-grid';
import '../../../css/data-grid-custom.css';
import { setAddNewRowDataFW, setAddNewRowFW } from "@/Store/Reducers/TableSlice";
import { useSelector, useDispatch } from "react-redux";

const SaveDeleteComponent = () => {
    const dispatch = useDispatch();
    const { addNewRowDataFW } = useSelector((state) => state.table);
    const onSubmitHandler = (e) => {
      console.log(addNewRowDataFW);
      e.preventDefault();
      if (!addNewRowDataFW['siteName']) {
   
        return toast.error('Site name is required')
    }
      router.post(route("api.implementation.add.row"), {newItem:addNewRowDataFW}, {
        onSuccess: () => {
          dispatch(setAddNewRowFW(false));
          toast.success("Row Added successfully");
        },
      });
    };
    const handeOnDelete = () => {
      dispatch(setAddNewRowFW(false));
      (setAddNewRowDataFW({}));
  
    };
    return (
      <div className="flex gap-2 mt-1">
        <Button
          variant="gradient"
          size="sm"
          className="capitalize py-1 px-2 rounded font-semibold"
          onClick={onSubmitHandler}
        >
          Save
        </Button>
        <Button
          variant="gradient"
          color="red"
          size="sm"
          className="capitalize py-1 px-2 rounded"
          onClick={handeOnDelete}
        >
          <Trash2Icon size={14} />
        </Button>
      </div>
    );
  };

export default function AddNewRow({ setAddNewRow }) {
    const dispatch = useDispatch();
    const { columns } = useSelector((state) => state.table);
  
    // Convert AG Grid column definitions to Material UI DataGrid format
    const gridColumns = useMemo(() => {
      let result = [];
      if (columns?.length > 0) {
        result = columns.map((col) => ({
          field: col.field,
          headerName: col.headerName,
          sortable: true,
          filterable: true,
          editable: col.editable !== false,
          flex: 1,
          renderCell: (params) => {
            if(col.field === "Actions" || col.field === "actions") {
              return <SaveDeleteComponent />;
            }
            return params.value;
          }
        }));
      }
      return result;
    }, [columns]);
  
    // Initialize a single empty row for the data grid with a unique id
    const rows = useMemo(() => {
      return [{
        id: 'new-row-1', // Unique id required by Material UI DataGrid
        // Add default empty values for all fields except actions
        ...Object.fromEntries(
          gridColumns
            .filter(col => col.field !== "Actions" && col.field !== "actions")
            .map(col => [col.field, ''])
        )
      }];
    }, [gridColumns]);
  
    // Handle cell edit in DataGrid
    const handleCellEditCommit = (params) => {
      const { field, value } = params;
      
      dispatch(
        setAddNewRowDataFW({
          ...rows[0],
          [field]: value,
        })
      );
    };
  
    return (
      <div className="mx-auto mt-5">
        <div style={{ height: 150, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={gridColumns}
            pageSize={1}
            rowsPerPageOptions={[1]}
            checkboxSelection={false}
            disableSelectionOnClick
            onCellEditCommit={handleCellEditCommit}
            hideFooter
          />
        </div>
      </div>
    );
  }