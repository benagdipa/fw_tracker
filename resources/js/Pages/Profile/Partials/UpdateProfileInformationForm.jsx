import { useState, useRef } from 'react';
import InputError from '@/Components/InputError';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { 
    Typography, 
    Button, 
    Input,
    Avatar, 
    Card,
    CardBody,
    Tooltip
} from '@material-tailwind/react';
import { PhotoIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;
    const [avatarPreview, setAvatarPreview] = useState(user.profile_photo || null);
    const fileInputRef = useRef(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
        profile_photo: null,
        _method: 'PATCH',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                // Clear the file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target.result);
                setData('profile_photo', file);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setAvatarPreview(null);
        setData('profile_photo', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <section className={className}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                    <Typography variant="h4" className="font-semibold text-gray-900 dark:text-white">
                        Profile Information
                    </Typography>
                    <Typography className="mt-1 text-gray-600 dark:text-gray-400">
                        Update your account's profile information and email address.
                    </Typography>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-8">
                {/* Profile Photo Section */}
                <div className="max-w-xl">
                    <Typography variant="h6" className="mb-3 text-gray-900 dark:text-white">
                        Profile Photo
                    </Typography>
                    
                    <div className="flex items-center gap-6">
                        <Avatar
                            src={avatarPreview}
                            alt={data.name}
                            size="xxl"
                            className="h-24 w-24 shadow-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        />
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outlined"
                                className="flex items-center gap-2 dark:text-gray-400 dark:border-gray-400 hover:dark:text-white hover:dark:border-white"
                                size="sm"
                                color="blue-gray"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <PhotoIcon className="h-4 w-4" />
                                Change Photo
                            </Button>

                            {avatarPreview && (
                                <Button
                                    variant="text"
                                    color="red"
                                    size="sm"
                                    className="flex items-center gap-2 dark:text-red-400 hover:dark:text-red-500"
                                    onClick={removePhoto}
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                    Remove Photo
                                </Button>
                            )}
                        </div>
                        
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            accept="image/*"
                        />
                    </div>
                </div>

                {/* Name and Email Section */}
                <div className="max-w-xl space-y-6">
                    <div>
                        <Input
                            label="Name"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className="dark:text-white"
                            labelProps={{
                                className: "dark:text-gray-400"
                            }}
                            containerProps={{
                                className: "min-w-[250px]"
                            }}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <Input
                            type="email"
                            label="Email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className="dark:text-white"
                            labelProps={{
                                className: "dark:text-gray-400"
                            }}
                            containerProps={{
                                className: "min-w-[250px]"
                            }}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div>
                            <Typography className="text-sm mt-2 text-gray-800 dark:text-gray-200">
                                Your email address is unverified.
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="underline text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                                >
                                    Click here to re-send the verification email.
                                </Link>
                            </Typography>

                            {status === 'verification-link-sent' && (
                                <div className="mt-2 font-medium text-sm text-green-600 dark:text-green-400">
                                    A new verification link has been sent to your email address.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing}>Save</Button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <Typography className="text-sm text-gray-600 dark:text-gray-400">
                            Saved.
                        </Typography>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
