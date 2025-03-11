import React, { useState } from 'react'
import Authenticated from '@/Layouts/AuthenticatedLayout'
import { Head, Link } from '@inertiajs/react';
import { Card, Chip, Timeline, TimelineBody, TimelineConnector, TimelineHeader, TimelineIcon, TimelineItem, Tooltip, Typography, Tabs, TabsHeader, Tab } from '@material-tailwind/react';
import { FileBarChartIcon, ImageIcon, HistoryIcon, InfoIcon, TagIcon, CalendarIcon, CheckCircleIcon, AlertCircleIcon, FileTextIcon, FileIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import UploadItem from '@/Components/Implementation/FieldItems/Edit/UploadItem';

export default function Show({ auth, implementation, trackings, tracking, implementationHistory }) {
    const [activeTab, setActiveTab] = useState("info");
    
    const TABLE_HEAD = [
        'category', 
        'siteName', 
        'eNB_gNB', 
        'implementor', 
        'status', 
        'comments', 
        'enm_scripts_path',
        'sp_scripts_path', 
        'CRQ', 
        'Date',
    ];
    
    const getTrackingValue = (tracking, key) => {
        if (tracking) {
            if (key === 'Date') {
                return showFormattedDate(tracking[key]?.value)
            } else if (key === 'category' || key === 'status') {
                return getDropDownValue(tracking[key]?.value)
            }
            else {
                return tracking[key]?.value
            }
        }
    }
    
    const getDropDownValue = (value) => {
        if (value) {
            return value.replace(/_/g, ' ')
        }
    }
    
    const showFormattedDate = (date) => {
        if (date) {
            try {
                const dateObject = parseISO(date);
                return format(dateObject, 'dd/MM/yyyy');
            } catch (error) {
                return date;
            }
        }
        return '';
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

            const handleDownload = (fileUrl, fileName) => {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            return (
                <div className="flex mt-3 gap-2">
                    {existingFiles?.map((file, index) => (
                        <React.Fragment key={index}>
                            {getFileExtension(file) === 'csv' && (
                                <Tooltip content={getFileName(file)}>
                                    <FileBarChartIcon onClick={() => handleDownload(file, getFileName(file))} className='cursor-pointer text-blue-500' />
                                </Tooltip>
                            )}
                            {getFileExtension(file) === 'txt' && (
                                <Tooltip content={getFileName(file)}>
                                    <FileTextIcon onClick={() => handleDownload(file, getFileName(file))} className='cursor-pointer text-gray-500' />
                                </Tooltip>
                            )}
                            {getFileExtension(file) === 'pdf' && (
                                <Tooltip content={getFileName(file)}>
                                    <FileIcon onClick={() => handleDownload(file, getFileName(file))} className='cursor-pointer text-red-500' />
                                </Tooltip>
                            )}
                            {(getFileExtension(file) === 'jpg' || getFileExtension(file) === 'png' || getFileExtension(file) === 'jpeg') && (
                                <Tooltip content={getFileName(file)}>
                                    <ImageIcon onClick={() => handleDownload(file, getFileName(file))} className='cursor-pointer text-green-500' />
                                </Tooltip>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )
        }
    }
    
    const getStatusChip = (status) => {
        if (!status) return null;
        
        let color = "gray";
        
        if (status.toLowerCase().includes("complete") || status.toLowerCase().includes("active")) {
            color = "green";
        } else if (status.toLowerCase().includes("pending") || status.toLowerCase().includes("progress")) {
            color = "blue";
        } else if (status.toLowerCase().includes("error") || status.toLowerCase().includes("fail")) {
            color = "red";
        } else if (status.toLowerCase().includes("warning") || status.toLowerCase().includes("attention")) {
            color = "amber";
        }
        
        return <Chip size="sm" variant="ghost" value={status} color={color} className="capitalize" />;
    }
    
    const getIconForChangeType = (changeType) => {
        switch (changeType) {
            case 'Date':
                return <CalendarIcon className="h-4 w-4" />;
            case 'category':
                return <TagIcon className="h-4 w-4" />;
            case 'status':
                return <CheckCircleIcon className="h-4 w-4" />;
            default:
                return <InfoIcon className="h-4 w-4" />;
        }
    };

    return (
        <Authenticated user={auth?.user}>
            <Head title={`Implementation: ${implementation?.siteName || 'Details'}`} />
            <div className="top-section p-4">
                <div className='flex items-center justify-between'>
                    <div className="">
                        <Typography variant={'h3'} className='tracking-tight'>{implementation?.siteName}</Typography>
                        <ul className='flex gap-1 text-gray-600 text-sm'>
                            <li><Link href={route('dashboard')}>Dashboard</Link></li>
                            <li>/</li>
                            <li><Link href={route('implementation.field.name.index')}>Implementation</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="px-4 mb-4">
                <Tabs value={activeTab}>
                    <TabsHeader className="rounded-none border-b border-blue-gray-50 bg-transparent p-0">
                        <Tab value="info" onClick={() => setActiveTab("info")} className={activeTab === "info" ? "text-blue-500 border-b-2 border-blue-500" : ""}>
                            Implementation Details
                        </Tab>
                        <Tab value="history" onClick={() => setActiveTab("history")} className={activeTab === "history" ? "text-blue-500 border-b-2 border-blue-500" : ""}>
                            Change History
                        </Tab>
                    </TabsHeader>
                </Tabs>
            </div>
            
            {activeTab === "info" ? (
                <div className="content px-4">
                    <Card className="h-full w-full rounded-md shadow-sm">
                        <div className="overflow-x-auto overflow-hidden">
                            <table className="w-full min-w-max table-auto text-left">
                                <thead>
                                    <tr>
                                        {TABLE_HEAD.map((head) => (
                                            <th key={head} className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 border-l cursor-pointer">
                                                <div className="flex justify-between">
                                                    <Typography variant="small" className="leading-none text-gray-800 font-medium text-sm">{head}</Typography>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr key={implementation?.id} className="even:bg-blue-gray-50/50">
                                        <td className="border-l h-10 text-[12px] font-medium ps-2 capitalize">
                                            {getTrackingValue(tracking, 'category')}
                                        </td>
                                        <td className="border-l h-10 text-[12px] font-medium ps-2">{implementation?.siteName}</td>
                                        <td className="border-l h-10 text-[12px] font-medium ps-2">{implementation?.eNB_gNB}</td>
                                        <td className="border-l h-10 text-[12px] font-medium ps-2">{implementation?.implementor}</td>
                                        <td className="border-l h-10 text-[12px] font-medium ps-2 capitalize">
                                            {getStatusChip(getTrackingValue(tracking, 'status'))}
                                        </td>
                                        <td className="border-l h-10 text-[12px] font-medium ps-2">{implementation?.comments}</td>
                                        <td className="border-l h-10 text-[12px] font-medium ps-2">{implementation?.enm_scripts_path}</td>
                                        <td className="border-l h-10 text-[12px] font-medium ps-2">{implementation?.sp_scripts_path}</td>
                                        <td className="border-l h-10 text-[12px] font-medium ps-2">{implementation?.CRQ}</td>
                                        <td className="border-l h-10 text-[12px] font-medium ps-2">{getTrackingValue(tracking, 'Date')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="history-container px-4">
                    <Card className="h-full w-full rounded-md shadow-sm p-6">
                        <Typography variant="h5" color="blue-gray" className="mb-4">
                            <div className="flex items-center gap-2">
                                <HistoryIcon className="h-5 w-5" />
                                Change History
                            </div>
                        </Typography>
                        
                        <Timeline>
                            {trackings?.map((tracking, index) => {
                                const userName = tracking?.user?.name || 'Unknown User';
                                
                                return (
                                    <TimelineItem key={index}>
                                        {index + 1 !== trackings?.length && <TimelineConnector />}
                                        <TimelineHeader className="h-3">
                                            <TimelineIcon className="p-0">
                                                {getIconForChangeType(tracking.key)}
                                            </TimelineIcon>
                                            <div className="flex flex-col">
                                                <Typography variant="h6" color="blue-gray" className="leading-none">
                                                    {format(new Date(tracking.created_at), 'MMMM dd, yyyy')}
                                                </Typography>
                                                <Typography variant="small" color="gray" className="font-normal">
                                                    {format(new Date(tracking.created_at), 'h:mm a')}
                                                </Typography>
                                            </div>
                                        </TimelineHeader>
                                        <TimelineBody className="pb-8">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                                        {userName}
                                                    </Typography>
                                                    <Typography variant="small" color="gray">
                                                        updated
                                                    </Typography>
                                                    <Typography variant="small" color="blue" className="font-semibold capitalize">
                                                        {tracking.key ? tracking.key.replace(/_/g, ' ') : ''}
                                                    </Typography>
                                                </div>
                                                
                                                <div className="mt-1 px-3 py-2 bg-gray-50 rounded-md">
                                                    {tracking?.key === 'status' ? (
                                                        getStatusChip(tracking.value)
                                                    ) : tracking?.key === 'Date' ? (
                                                        showFormattedDate(tracking.value)
                                                    ) : (
                                                        tracking.value
                                                    )}
                                                </div>
                                            </div>
                                        </TimelineBody>
                                    </TimelineItem>
                                );
                            })}
                        </Timeline>
                    </Card>
                </div>
            )}
        </Authenticated>
    )
}
