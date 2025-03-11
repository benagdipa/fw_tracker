import React, { useState, useMemo, useEffect } from 'react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, IconButton, Menu, MenuHandler, MenuItem, MenuList, Typography, Dialog, DialogHeader, DialogBody, DialogFooter, Textarea } from '@material-tailwind/react';
import { EllipsisVerticalIcon, SearchIcon } from 'lucide-react';
import ImportCSV from '@/Components/Table/ImportCSV';
import ColumnOptions from '@/Components/Table/ColumnOptions/ColumnOptions';
import RestoreTable from '@/Components/Table/ColumnOptions/RestoreTable';
import DeleteTable from '@/Components/Table/DeleteTable';
import { DataGrid } from '@mui/x-data-grid';
import '../../../css/data-grid-custom.css';
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';
import axios from 'axios';

export default function ViewTableItem({ auth, entity }) {
    const { role } = auth;
    const [deleteTableDialog, setDeleteTableDialog] = useState(false);
    const [perPage, setPerPage] = useState(10);
    const [addNewRow, setAddNewRow] = useState(false);
    const [rowData, setRowData] = useState([]);
    const [newRowData, setNewRowData] = useState({});
	const [totalRows, setTotalRows] = useState(0); // Added state for total rows
	
    const handlePerPageChange = (val) => {
        setPerPage(val);
    };

    const columns = useMemo(() => {
        return [
            ...entity?.attributes?.map((head) => ({
                field: head?.slug,
                headerName: head?.alternative_name || head.name,
                sortable: head?.sortable || true,
                filterable: true,
                hide: head?.hidden || false,
                editable: true,
                flex: 1,
                renderCell: (params) => (
                    <Typography variant="small" className="leading-none text-gray-800 font-medium text-sm">
                        {params.value}
                    </Typography>
                ),
            })) || [],
            {
                field: "actions",
                headerName: "Actions",
                sortable: false,
                filterable: false,
                editable: false,
                flex: 1,
                renderCell: (params) => (
                    <Menu>
                        <MenuHandler>
                            <IconButton variant="text" color="blue-gray">
                                <EllipsisVerticalIcon className="h-5 w-5" />
                            </IconButton>
                        </MenuHandler>
                        <MenuList>
                            <MenuItem onClick={() => handleDeleteRow(params.row.id)}>Delete</MenuItem>
                            <MenuItem onClick={() => handleEditRow(params.row)}>Edit</MenuItem>
                        </MenuList>
                    </Menu>
                ),
            }
        ];
    }, [entity?.attributes]);

    useEffect(() => {
        const data = entity?.values?.data?.map((entity_values) => {
            let values = [];
            try {
                values = Array.isArray(JSON.parse(entity_values?.values)) ? JSON.parse(entity_values?.values) : [];
            } catch (error) {
                console.error("Error parsing JSON:", entity_values?.values, error);
                values = [];
            }

            const formattedRow = {};

            if (Array.isArray(entity?.attributes)) {
                entity?.attributes.forEach((header) => {
                    if (Array.isArray(values)) {
                        values.forEach((item) => {
                            if (item[header.slug]) {
                                formattedRow[header.slug] = item[header.slug];
                            }
                        });
                    }
                });
            }

            formattedRow.id = entity_values?.id;
            return formattedRow;
        }) || [];
        setRowData(data);

        // Set total rows using entity?.values?.data?.length
        const totalRowsCount = entity?.values?.data?.length || 0;
        setTotalRows(totalRowsCount);
       // alert(`Total number of rows: ${totalRowsCount}`); // Alert total rows
    }, [entity?.values?.data, entity?.attributes]);

    const handleDeleteRow = (id) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete this row with ID: ${id}?`);
        if (confirmDelete) {
            axios
                .delete(route('table.delete.row', { id }))
                .then((response) => {
                    if (response.data.success) {
                        window.location.reload();  // Reload the page after successful deletion
                    } else {
                        alert('Error deleting row. Please try again.');
                    }
                })
                .catch((error) => {
                    console.error('Error deleting row:', error);
                    alert('An error occurred while deleting the row.');
                });
        }
    };

    const handleSaveRow = (data, id) => {
        console.log("Saving data for ID:", id);
        console.log("Data:", data);

        for (let key in data) {
            if (data[key] === undefined || data[key] === null) {
                alert(`Field ${key} is missing or empty.`);
                return;
            }
        }

        const transformedData = Object.keys(data).map(key => ({ [key]: data[key] }));

        axios
            .post(route('table.save.row', { id }), { changedItems: transformedData, id })
            .then((response) => {
                if (response.data.success) {
                    window.location.reload();  // Reload the page after successful save
                } else {
                    alert(`Error saving row: ${response.data.error || 'Unknown error'}`);
                }
            })
            .catch((error) => {
                console.error("Error saving row:", error);
                alert(`An error occurred while saving: ${error.message}`);
            });
    };

    const handleAddNewRow = () => {
        const transformedData = Object.keys(newRowData).map((key) => ({
            [key]: newRowData[key],
        }));

        const dataToSend = {
            entity_id: entity.id,
            newItem: transformedData,
        };

        console.log("Data to send:", dataToSend);

        axios
            .post(route('table.add.row'), dataToSend)
            .then((response) => {
                if (response.data.success) {
					setAddNewRow(false);  // Close the dialog after successful addition
                    window.location.reload();  // Reload the page after adding new row
                } else {
                    alert('Error adding row.');
                }
            })
            .catch((error) => {
                console.error('Error adding row:', error);
                alert('An error occurred while adding the row.');
            });
    };

    const rows = useMemo(() => {
        return rowData.map(row => ({
            ...row,
            id: row.id || Math.random().toString(36).substr(2, 9) // Ensure each row has a unique id
        }));
    }, [rowData]);

    const handleCellEditCommit = (params) => {
        const { id, field, value } = params;
        const updatedRow = rowData.find(row => row.id === id);
        if (updatedRow) {
            const updatedData = { ...updatedRow, [field]: value };
            handleSaveRow(updatedData, id);
        }
    };

    return (
        <Authenticated user={auth?.user}>
            <Head title={entity?.title} />
            <div className="top-section p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Typography variant={'h3'} className="tracking-tight">
                            {entity?.title}
                        </Typography>
                        <ul className="flex gap-1 text-gray-600 text-sm">
                            <li>
                                <Link href={route('dashboard')}>Dashboard</Link>
                            </li>
                            <li>/</li>
                            <li>
                                <Link href={route('view.table.item', entity?.slug)}>{entity?.title}</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <Menu>
                            <MenuHandler>
                                <Button variant="text" size="sm">
                                    <EllipsisVerticalIcon size={18} color="gray" />
                                </Button>
                            </MenuHandler>
                            <MenuList className="font-semibold text-gray-600 max-w-32">
                                <MenuItem
                                    onClick={() => {
                                        setDeleteTableDialog(true);
                                    }}
                                    className="text-red-500 hover:!text-red-500"
                                >
                                    Delete
                                </MenuItem>
                            </MenuList>
                        </Menu>
                        <DeleteTable
                            deleteTableDialog={deleteTableDialog}
                            setDeleteTableDialog={setDeleteTableDialog}
                            tableId={entity?.id}
                        />
                    </div>
                </div>
            </div>

            <Dialog open={addNewRow} handler={() => setAddNewRow(false)}>
			  <DialogHeader>Add New Row</DialogHeader>
			  <DialogBody divider style={{ maxHeight: '400px', overflowY: 'auto' }}>
				{entity?.attributes?.length === 0 ? (
				  <Typography>No columns available to add data</Typography>
				) : (
				  entity?.attributes?.map((attr, index) => (
					<div key={index} className="mb-4">
					  <Typography variant="small" className="text-gray-800">
						{attr?.name || attr?.alternative_name || `Column ${index + 1}`}
					  </Typography>
					  <TextInput
						label={attr?.name || attr?.alternative_name || `Column ${index + 1}`}
						onChange={(e) =>
						  setNewRowData((prev) => ({
							...prev,
							[attr.slug]: e.target.value,
						  }))
						}
					  />
					</div>
				  ))
				)}
			  </DialogBody>
			  <DialogFooter>
				<Button variant="text" color="red" onClick={() => setAddNewRow(false)} className="mr-1">
				  Close
				</Button>
				<Button variant="gradient" color="green" onClick={handleAddNewRow}>
				  Add Row
				</Button>
			  </DialogFooter>
			</Dialog>


            {entity?.attributes.length === 0 && (
                <div className="text-center border rounded py-6">
                    <Typography variant="h4" color="blue-gray" className="mb-3">
                        It seems you haven't created any columns yet.
                    </Typography>
                    <Link href={route('table.wizard.column.index', entity?.id)}>
                        <Button variant="gradient" size="sm" className="capitalize">
                            Create Column
                        </Button>
                    </Link>
                </div>
            )}

            {entity?.attributes.length > 0 && (
                <>
                    <div className="filter-wrapper md:px-4">
                        <div className="flex filter-details justify-end gap-2">
                            <div className="search-wrapper w-1/6 flex relative">
                                <TextInput
                                    placeholder="Search..."
                                    className="w-full text-sm rounded-md rounded-r-none border-r-0 focus:ring-0 h-8"
                                />
                                <div className="search-icon">
                                    <IconButton size="sm" className="rounded-l-none">
                                        <SearchIcon color="white" size={18} />
                                    </IconButton>
                                </div>
                            </div>
                            {role === 'super-admin' && (
                                <React.Fragment>
                                    <ImportCSV columns={entity?.attributes} />
                                    <ColumnOptions columns={entity?.attributes} />
                                    <RestoreTable entity_id={entity?.id} />
                                </React.Fragment>
                            )}
                        </div>
                    </div>
                    <div className="content mt-6">
                        <Card className="h-full w-full rounded-none">
                            <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
                                <DataGrid
                                    rows={rows}
                                    columns={columns}
                                    pageSize={perPage}
                                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                                    checkboxSelection={false}
                                    disableSelectionOnClick
                                    onCellEditCommit={handleCellEditCommit}
                                    loading={loading}
                                    paginationMode="server"
                                    rowCount={totalRows}
                                    onPageChange={(page) => fetchData(page + 1)}
                                    onPageSizeChange={handlePerPageChange}
                                />
                            </div>
                            <div className="pagination flex justify-between items-center">
                                <div className="px-4">
                                    <Button
                                        variant="gradient"
                                        size="sm"
                                        className="capitalize rounded"
                                        onClick={() => {
                                            setAddNewRow(true);
                                        }}
                                    >
                                        Add New Row
                                    </Button>
                                </div>
                                <div className="md:flex grid justify-start md:justify-end items-center pt-6 mb-8 gap-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium">Rows per Page</div>
                                        <select
                                            className="rounded-md text-sm font-medium border-gray-400 focus:ring-0 py-2"
                                            value={perPage}
                                            onChange={(e) => {
                                                handlePerPageChange(e.target.value);
                                            }}
                                        >
                                            <option value="10">10</option>
                                            <option value="15">15</option>
                                            <option value="20">20</option>
                                            <option value="25">25</option>
                                            <option value="50">50</option>                                   
                                        </select>
                                    </div>
                                    <div className="text-sm font-medium">
                                        {`${entity?.values?.from}-${entity?.values?.to} of ${entity?.values?.total} Records`}
                                    </div>
                                    <Pagination links={entity?.values?.links} perPage={perPage} />
                                </div>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </Authenticated>
    );
}
