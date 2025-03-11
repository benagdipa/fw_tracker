import React, { useState } from 'react'
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from '@material-tailwind/react'
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import axios from 'axios';
import { useForm } from '@inertiajs/react';
export default function AddUser({ roles }) {
    const [addDialog, setAddDialog] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searchResultState, setSearchResultState] = useState(false)

    const { data, setData, post, processing, errors, reset } = useForm({
        'email': '',
        'role_name': ''
    })

    const handleSearch = async (e) => {
        setSearchText(e.target.value)
        if (e.target.value.length >= 3) {
            setSearchResultState(true)
            const res = await axios.post(route('roles.user.search'), { query: e.target.value })
            if (res?.data.length) {
                setSearchResults(res.data)
            }
        } else {
            setSearchResultState(false)
            setSearchResults([])
        }
    }

    const handleSearchResult = (item) => {
        setData('email', item?.email)
        setSearchText('')
        setSearchResultState(false)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        post(route('roles.user.store'), {
            onSuccess: () => {
                setAddDialog(false)
                reset()
            }
        })
    }

    return (
        <>
            <Button
                variant="gradient"
                className='capitalize'
                size='sm'
                onClick={() => setAddDialog(true)}
                style={{ background: 'linear-gradient(90deg, #0057B8 0%, #0072CE 100%)', color: '#FFFFFF' }}
            >
                Add Role to user
            </Button>
            <Dialog open={addDialog} size={'xs'}>
                <DialogHeader>Add Role To User</DialogHeader>
                <DialogBody>
                    <div className='field-item mb-4'>
                        <InputLabel value="Search User" />
                        <TextInput
                            className="w-full text-sm font-normal"
                            placeholder="Search User..."
                            value={searchText}
                            onChange={(e) => { handleSearch(e) }}
                        />
                        <div className='relative'>
                            <div className="search-results absolute bg-gray-50 w-full rounded shadow-xl z-50">
                                {searchResultState && searchResults?.length > 0 && searchResults?.map((item, index) => {
                                    return (
                                        <React.Fragment key={item?.id}>
                                            <div className="py-3 px-2 border-b cursor-pointer" onClick={() => { handleSearchResult(item) }}>
                                                <p className='text-sm text-gray-600'>{`${item?.email}`}</p>
                                            </div>
                                        </React.Fragment>
                                    )
                                })}
                                {searchResultState && searchResults?.length === 0 && (
                                    <div className='py-4 px-2 text-center font-medium'><p>No User Found</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='field-item mb-4'>
                        <InputLabel value="User's Email" />
                        <TextInput
                            className="w-full text-sm font-normal"
                            placeholder="User's Email..."
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>
                    <div className='field-item mb-4'>
                        <InputLabel value="Role Name" />
                        <select
                            className='border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm w-full font-normal capitalize'
                            value={data.role_name}
                            onChange={(e) => setData('role_name', e.target.value)}
                        >
                            <option value="">Select</option>
                            {roles?.length > 0 && roles.map((role, index) => { return <option key={index} value={role.name}>{role.name}</option> })}
                        </select>
                        <InputError message={errors.role_name} className="mt-2 font-medium text-xs" />
                    </div>
                </DialogBody>
                <DialogFooter>
                <Button style={{ backgroundColor: '#FF0000', color: 'white', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }} onClick={() => setAddDialog(false)} className="mr-1 capitalize">
                    <span>Cancel</span>
                </Button>
                    <Button style={{ backgroundColor: '#0057B8', color: 'white', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }} onClick={(e) => handleSubmit(e)}>
                        <span>Submit</span>
                    </Button>
                </DialogFooter>
            </Dialog>
        </>
    )
}
