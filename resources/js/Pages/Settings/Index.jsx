import React, { useState, useMemo, useEffect } from "react";

import { Trash2Icon, Database, DatabaseZapIcon, Network, Settings2 } from "lucide-react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Typography,
  Select,
  Option,
  Tooltip,
  IconButton,
} from "@material-tailwind/react";
import { setDataBaseChange } from "@/Store/Reducers/TableSlice";
import NewConnection from "@/Components/Settings/NewConnection";
import { DataGrid } from '@mui/x-data-grid';
import '../../../css/data-grid-custom.css';

const LinkSql = (params) => {
  return (
    <Link
      href={route("sql.import", params.row.id)}
      className="font-semibold underline"
    >
      {params.row.host}
    </Link>
  );
};

const SaveDeleteComponent = (params) => {
  const { processing, delete: destroy } = useForm();
  const { databaseChanged } = useSelector(state => state.table);

  const onDeleteBtnHandler = () => {
    destroy(route('import.db.delete', params.row.id), {
      preserveScroll: true,
    })
  }

  const onEditBtnHandler = async () => {
    if (databaseChanged.length > 0) {
      let toSaveitems = databaseChanged.filter(item => item.id === params.row.id)[0]

      if (toSaveitems) {
        const res = await axios.post(route('import.db.store'), {
          id: toSaveitems?.items?.id,
          dbtype: toSaveitems?.items?.dbtype,
          host: toSaveitems?.items?.host,
          port: toSaveitems?.items?.port,
          database: toSaveitems?.items?.database,
          username: toSaveitems?.items?.username,
          password: toSaveitems?.items?.password,
          catalog: toSaveitems?.items?.catalog,
        })

        if (res?.data?.success) {
          toast.success(res?.data?.success?.message)
        }
      }
    }
  }

  return (
    <div className="flex gap-2 my-2">
      <Link
        href={route("sql.import", params.row.id)}
        className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition-all flex items-center gap-1 text-xs"
      >
        <Database size={14} /> Explore
      </Link>
      <Button
        size="sm"
        className="capitalize py-1 px-2 rounded font-semibold"
        onClick={() => { onEditBtnHandler() }}
        color="blue"
      >
        Edit
      </Button>
      <Button
        variant="gradient"
        color="red"
        size="sm"
        className="capitalize py-1 px-2 rounded"
        onClick={onDeleteBtnHandler}
      >
        <Trash2Icon size={14} />
      </Button>
    </div>
  );
};

export default function Index({ auth, db }) {
  const dispatch = useDispatch();
  const [openNewConnection, setOpenNewConnection] = useState(false);
  const [changedItems, setChangedItems] = useState([]);
  
  const columns = [
    {
      field: "host",
      headerName: "HOST",
      flex: 1,
      sortable: true,
      filterable: true,
      editable: false,
      renderCell: (params) => <LinkSql {...params} />
    },
    {
      field: "port",
      headerName: "PORT",
      width: 100,
      sortable: true,
      filterable: true,
      editable: true
    },
    {
      field: "database",
      headerName: "Database",
      flex: 1,
      sortable: true,
      filterable: true,
      editable: true
    },
    {
      field: "username",
      headerName: "Username",
      width: 120,
      sortable: true,
      filterable: true,
      editable: true
    },
    {
      field: "dbtype",
      headerName: "Type",
      width: 100,
      sortable: true,
      filterable: true,
      editable: true
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      filterable: false,
      editable: false,
      renderCell: (params) => <SaveDeleteComponent {...params} />
    }
  ];

  const onSetNewConnection = () => {
    setOpenNewConnection(!openNewConnection);
  };

  useEffect(() => {
    if (changedItems.length > 0) {
      dispatch(setDataBaseChange(changedItems));
    }
  }, [changedItems]);

  const handleCellEditCommit = (params) => {
    const index = changedItems.findIndex(
      (item) => item.id === params.id
    );

    if (index !== -1) {
      setChangedItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index] = {
          ...updatedItems[index],
          items: {
            ...updatedItems[index].items,
            [params.field]: params.value,
          },
        };
        return updatedItems;
      });
    } else {
      setChangedItems((prevItems) => [
        ...prevItems,
        {
          id: params.id,
          items: {
            ...db.find(item => item.id === params.id),
            [params.field]: params.value,
          },
        },
      ]);
    }
  };

  const rows = db.map(row => ({
    ...row,
    id: row.id || Math.random().toString(36).substr(2, 9)
  }));

  return (
    <Authenticated user={auth?.user}>
      <Head title="SQL Explorer" />
      <div className="top-section p-4">
        <div className="bg-white shadow rounded py-3 px-5 flex justify-between items-center">
          <div className="flex items-center justify-between w-full">
            <div className="">
              <Typography variant={"h3"} className="tracking-tight">
                SQL Explorer
              </Typography>
              <ul className="flex gap-1 text-gray-600 text-sm">
                <li>
                  <Link href={route("dashboard")}>Dashboard</Link>
                </li>
                <li>/</li>
                <li>
                  SQL Explorer
                </li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                variant="gradient"
                size="sm"
                className="capitalize rounded text-sm flex items-center gap-1"
                onClick={onSetNewConnection}
              >
                <DatabaseZapIcon className="h-4 w-4" /> New Connection
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <Card className="shadow-md">
          <CardHeader floated={false} shadow={false} className="rounded-none px-4 py-2 border-b">
            <Typography variant="h5" color="blue-gray">
              Database Connections
            </Typography>
            <Typography color="gray" className="mt-1 text-sm">
              Connect to your databases and explore data using SQL queries
            </Typography>
          </CardHeader>
          <CardBody className="px-0 pt-0 pb-2">
            <div style={{ height: db?.length > 5 ? 500 : 400, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 25]}
                checkboxSelection={false}
                disableSelectionOnClick
                onCellEditCommit={handleCellEditCommit}
                autoHeight={db?.length < 6}
                sx={{
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f7fafc',
                  },
                }}
              />
            </div>
          </CardBody>
        </Card>
      </div>
      <NewConnection
        openNewConnection={openNewConnection}
        setOpenNewConnection={setOpenNewConnection}
      />
    </Authenticated>
  );
}
