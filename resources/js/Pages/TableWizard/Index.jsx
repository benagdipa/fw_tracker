import React from 'react'
import Authenticated from '@/Layouts/AuthenticatedLayout'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button, Typography } from '@material-tailwind/react'
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Index({ auth }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        slug: ''
    });

    const onSubmitHandle = () => {
        post(route('table.wizard.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset()
            }
        });
    }

    return (
        <Authenticated user={auth?.user}>
            <Head title="Table Wizard" />
            <div className="top-section p-4">
                <div className='flex items-center justify-between'>
                    <div className="left">
                        <Typography variant={'h3'} className='tracking-tight'>Self Service Table Wizard</Typography>
                        <ul className='flex gap-1 text-gray-600 text-sm'>
                            <li><Link href={route('dashboard')}>Dashboard</Link></li>
                            <li>/</li>
                            <li><Link href={route('table.wizard.index')}>Self Service Table Wizard</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="content mt-6 relative border-t">
                <div className="container mx-auto pt-12">
                    <div className="max-w-screen-md w-full">
                        <Typography variant='h2' color={"gray"} className='mb-8'> Enter table details.</Typography>
                        <div className="form-item mb-4">
                            <InputLabel value={'Name'} className='mb-1' />
                            <TextInput
                                className='w-full text-sm'
                                name="title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                            />
                            <InputError message={errors?.title} className="mt-2" />
                        </div>
                        <div className="form-item mb-4">
                            <InputLabel value={'Slug'} className='mb-1' />
                            <TextInput
                                className='w-full text-sm'
                                name="slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                            />
                            <InputError message={errors?.slug} className="mt-2" />
                        </div>
                        <div className="form-item flex justify-end">
                            <Button
                                variant='gradient'
                                color="green"
                                onClick={onSubmitHandle}
                                className='capitalize'
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

        </Authenticated>
    )
}
