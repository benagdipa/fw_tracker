import React, { useState, useMemo } from "react";
import { Button } from "@material-tailwind/react";
import { Trash2Icon } from "lucide-react";
import { router } from "@inertiajs/react";
import toast from "react-hot-toast";
import { DataGrid } from '@mui/x-data-grid';
import '../../../css/data-grid-custom.css';
import { setAddNewRowData, setAddNewRow } from "@/Store/Reducers/TableSlice";
import { useSelector, useDispatch } from "react-redux";

const SaveDeleteComponent = () => {
  const dispatch = useDispatch();
  const { addNewRowData } = useSelector((state) => state.table);
  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (!addNewRowData["loc_id"]) {
      return toast.error("LocId is required");
    }
    router.post(route("wireless.sites.add.row"), {newItem:addNewRowData}, {
      onSuccess: () => {
        dispatch(setAddNewRow(false));
        toast.success("Row Added successfully");
      },
    });
  };
  const handeOnDelete = () => {
    dispatch(setAddNewRow(false));
    (setAddNewRowData({}));

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

  const rows = useMemo(() => {
    return [{
      id: 'new-row-1',
      ...Object.fromEntries(
        gridColumns
          .filter(col => col.field !== "Actions" && col.field !== "actions")
          .map(col => [col.field, ''])
      )
    }];
  }, [gridColumns]);

  const handleCellEditCommit = (params) => {
    const { field, value } = params;
    
    dispatch(
      setAddNewRowData({
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
