import { useForm } from '@inertiajs/react';
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Tooltip } from '@material-tailwind/react';
import { FileBarChartIcon, ImageIcon,Download } from 'lucide-react';
import React from 'react'
import { useDropzone } from 'react-dropzone';

export default function UploadItem(props) {
    const  { data:siteData }=props;

    let single = false ;
    const handleOpen = () => setOpen(!open);
    const [open, setOpen] = React.useState(false);

    const { data, setData, post, processing, reset } = useForm({
        site_id: siteData?.id,
        location_id: siteData?.loc_id,
        field_name: props?.colDef?.field,
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
        post(route('wireless.sites.update.artifacts'), {
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
                        <div key={index} className={`${!single ? '' : 'pt-2'}`}>
                            {getFileExtension(file) === 'csv' && (
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

    if(siteData?.artifacts){

        console.log(JSON.parse(siteData?.artifacts)[0]);
    }
    return (
        <div className='w-full h-full'>
            {!single &&<div className='flex justify-center items-center'> <button className='font-medium text-[12px] w-[70%]' onClick={handleOpen}>upload</button><> {siteData?.artifacts && (<a href={`/dashboard/wireless-sites/artifacts/?q=${JSON.parse(siteData?.artifacts)}`}><Download className='cursor-pointer' size={20} /></a>)}</></div>}
            {siteData?.artifacts &&<>{JSON.parse(siteData?.artifacts).length>0&& <ShowFileIcons files={siteData?.value ? siteData?.value : ''} />}</>}
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
