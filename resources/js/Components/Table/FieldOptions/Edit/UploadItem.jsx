import React, { useState } from 'react'
import { useForm } from '@inertiajs/react';
import { useDropzone } from 'react-dropzone';
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Tooltip } from '@material-tailwind/react';
import { FileBarChartIcon, ImageIcon } from 'lucide-react';

export default function UploadItem({ value, headerSlug, columnId }) {



    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(!open);

    const { data, setData, post, processing, reset } = useForm({
        columnId: columnId,
        headerSlug: headerSlug,
        artifacts: []
    });

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: acceptedFiles => {
            setData('artifacts', [
                ...data.artifacts,
                ...acceptedFiles.map(file => Object.assign(file, {
                    preview: URL.createObjectURL(file)
                }))
            ]);
        }
    });

    const files = data?.artifacts.map(file => (
        <li key={file.path}>
            {file.path} - {file.size} bytes
        </li>
    ));

    const handleUpload = () => {
        post(route('table.upload.row.artifacts', columnId), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false)
            }
        })
    }

    const ShowFileIcons = ({ files }) => {
        if (files) {
            const existingFiles = JSON.parse(files)
            const getFileExtension = (filename) => {
                return filename.split('.').pop();
            };

            const getFileName = (filePath) => {
                const parts = filePath.split('/');
                let fileName = parts[parts.length - 1];
                fileName = fileName.replace(/^\d+_/, '');
                return fileName;
            }

            return (
                <div className="flex ps-2">
                    {existingFiles.map((file, index) => (
                        <div key={index} className='my-2'>
                            {getFileExtension(file) === 'csv' && (
                                <Tooltip content={getFileName(file)}>
                                    <FileBarChartIcon size={18} />
                                </Tooltip>
                            )}
                            {getFileExtension(file) === 'xlsx' && (
                                <Tooltip content={getFileName(file)}>
                                    <FileBarChartIcon size={18} />
                                </Tooltip>
                            )}
                            {getFileExtension(file) === 'xls' && (
                                <Tooltip content={getFileName(file)}>
                                    <FileBarChartIcon size={18} />
                                </Tooltip>
                            )}
                            {getFileExtension(file) === 'txt' && (
                                <img src="txt-icon.png" alt="Text File Icon" />
                            )}
                            {getFileExtension(file) === 'pdf' && (
                                <Tooltip content={getFileName(file)}>
                                    <ImageIcon />
                                </Tooltip>
                            )}
                        </div>
                    ))}
                </div>
            )
        }
    }

    return (
        <div className='w-full h-full flex items-center'>
            {<button className='font-medium text-[12px] mt-2 border py-1 px-2 rounded' onClick={handleOpen}>Uplaod</button>}
            {value && <ShowFileIcons files={value ? value : ''} />}
            <Dialog open={open} handler={handleOpen} size='xs'>
                <DialogHeader>Upload Artifacts</DialogHeader>
                <DialogBody>
                    <div className="border-dashed border py-12 text-sm text-center font-medium rounded-md border-gray-300">
                        <div {...getRootProps({ className: 'dropzone' })}>
                            <input {...getInputProps()} />
                            <p>Drag 'n' drop some files here, or click to select files</p>
                        </div>
                    </div>
                    {data?.artifacts.length > 0 && (
                        <aside>
                            <h4 className='font-sm font-semibold'>Files</h4>
                            <ul className='text-[12px] font-normal'>{files}</ul>
                        </aside>
                    )}

                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={handleOpen}
                        className="mr-1"
                    >
                        <span>Cancel</span>
                    </Button>
                    <Button
                        variant="gradient"
                        color="green"
                        onClick={handleUpload}
                        loading={processing}
                    >
                        <span>Confirm</span>
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    )
}
