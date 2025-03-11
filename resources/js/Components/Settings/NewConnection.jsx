import React from "react";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Typography,
  Select,
  Option,
  Spinner,
} from "@material-tailwind/react";

const NewConnection = ({ openNewConnection, setOpenNewConnection }) => {
  // Initialize form with empty values
  const { data, setData, post, processing, errors, reset } = useForm({
    dbtype: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    catalog: "",
    sslrequired: false
  });
  
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null); // null, 'success', 'error'

  // Handle form submission
  const onSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage("");
    setStatus(null);
    
    post(route("import.db.store"), {
      onSuccess: () => {
        setMessage("Connection saved successfully!");
        setStatus('success');
        
        // Reset form and close dialog after a short delay
        setTimeout(() => {
          reset();
          setOpenNewConnection(false);
        }, 1500);
      },
      onError: () => {
        setMessage("Failed to save connection. Please check your inputs.");
        setStatus('error');
      },
    });
  };

  // Handle dialog close
  const handleClose = () => {
    reset();
    setMessage("");
    setStatus(null);
    setOpenNewConnection(false);
  };

  return (
    <Dialog 
      open={openNewConnection} 
      size="sm"
      handler={handleClose}
      className="bg-white shadow-xl rounded-lg"
    >
      <form onSubmit={onSubmit}>
        <DialogHeader className="border-b px-6 py-4">
          <Typography variant="h5" color="blue-gray">
            Add New Database Connection
          </Typography>
        </DialogHeader>
        
        <DialogBody className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-5">
            {/* DB Type Selection */}
            <div className="form-field">
              <InputLabel value="Database Type" className="mb-2 font-medium" />
              <Select
                label="Select database type"
                onChange={(val) => setData("dbtype", val)}
                value={data.dbtype}
                className="bg-white"
                required
              >
                <Option value="mysql">MySQL</Option>
                <Option value="pgsql">PostgreSQL</Option>
                <Option value="starburst">Starburst</Option>
              </Select>
              <InputError message={errors.dbtype} className="mt-1" />
            </div>
            
            {/* Starburst-specific fields */}
            {data.dbtype === "starburst" && (
              <div className="form-field">
                <InputLabel value="Catalog" className="mb-2 font-medium" />
                <TextInput
                  className="w-full"
                  placeholder="Enter catalog name"
                  value={data.catalog}
                  onChange={(e) => setData("catalog", e.target.value)}
                />
                <InputError message={errors.catalog} className="mt-1" />
              </div>
            )}
            
            {/* Common fields */}
            <div className="form-field">
              <InputLabel value="Host" className="mb-2 font-medium" />
              <TextInput
                className="w-full"
                placeholder="127.0.0.1 or hostname"
                value={data.host}
                onChange={(e) => setData("host", e.target.value)}
                required
              />
              <InputError message={errors.host} className="mt-1" />
            </div>
            
            <div className="form-field">
              <InputLabel value="Port" className="mb-2 font-medium" />
              <TextInput
                className="w-full"
                placeholder="3306, 5432, etc."
                value={data.port}
                onChange={(e) => setData("port", e.target.value)}
                required
              />
              <InputError message={errors.port} className="mt-1" />
            </div>
            
            <div className="form-field">
              <InputLabel value="Database Name" className="mb-2 font-medium" />
              <TextInput
                className="w-full"
                placeholder="Enter database name"
                value={data.database}
                onChange={(e) => setData("database", e.target.value)}
                required
              />
              <InputError message={errors.database} className="mt-1" />
            </div>
            
            <div className="form-field">
              <InputLabel value="Username" className="mb-2 font-medium" />
              <TextInput
                className="w-full"
                placeholder="Database username"
                value={data.username}
                onChange={(e) => setData("username", e.target.value)}
                required
              />
              <InputError message={errors.username} className="mt-1" />
            </div>
            
            <div className="form-field">
              <InputLabel value="Password" className="mb-2 font-medium" />
              <TextInput
                className="w-full"
                placeholder="Database password"
                value={data.password}
                type="password"
                onChange={(e) => setData("password", e.target.value)}
                required
              />
              <InputError message={errors.password} className="mt-1" />
            </div>
          </div>
        </DialogBody>
        
        <DialogFooter className="px-6 py-4 border-t flex flex-col sm:flex-row justify-end gap-3">
          {message && (
            <div className={`mr-auto text-sm ${status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </div>
          )}
          
          <Button 
            variant="outlined" 
            color="blue-gray" 
            onClick={handleClose}
            disabled={processing}
          >
            Cancel
          </Button>
          
          <Button 
            variant="gradient" 
            color="blue" 
            type="submit"
            disabled={processing}
            className="flex items-center gap-2"
          >
            {processing ? (
              <>
                <Spinner className="h-4 w-4" /> 
                Saving...
              </>
            ) : "Save Connection"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default NewConnection;
