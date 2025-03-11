import { useRef, useState } from 'react';
import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';
import { 
    Typography, 
    Button, 
    Input,
    Card, 
    CardBody, 
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Alert
} from '@material-tailwind/react';
import { 
    ExclamationTriangleIcon, 
    TrashIcon, 
    ArrowDownTrayIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                    <Typography variant="h4" className="font-semibold text-gray-900 dark:text-white">
                        Delete Account
                    </Typography>
                    <Typography className="mt-1 text-gray-600 dark:text-gray-400">
                        Once your account is deleted, all of its resources and data will be permanently deleted.
                    </Typography>
                </div>
            </div>

            <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <CardBody className="p-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <Typography color="red" variant="h6" className="font-medium">
                                Warning: This action cannot be undone
                            </Typography>
                            <Typography variant="paragraph" className="mt-2 text-red-700 dark:text-red-300 text-sm">
                                Before deleting your account, please download any data or information that you wish to retain.
                                This action will erase all your data permanently from our systems.
                            </Typography>
                            <div className="mt-4">
                                <Button 
                                    color="blue" 
                                    variant="outlined" 
                                    size="sm" 
                                    className="flex items-center gap-2"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                    Download Your Data
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <div className="mt-6 flex justify-end">
                <Button
                    color="red"
                    variant="outlined"
                    onClick={confirmUserDeletion}
                    className="dark:text-red-400 dark:border-red-400 hover:dark:text-red-500 hover:dark:border-red-500"
                >
                    <TrashIcon className="h-4 w-4" />
                    Delete Account
                </Button>
            </div>

            <Dialog
                open={confirmingUserDeletion}
                handler={closeModal}
                className="dark:bg-gray-800"
            >
                <DialogHeader className="dark:text-white">
                    Are you sure you want to delete your account?
                </DialogHeader>

                <form onSubmit={deleteUser}>
                    <DialogBody className="overflow-y-auto">
                        <div className="max-w-xl">
                            <Typography className="mb-4 text-gray-600 dark:text-gray-400">
                                Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.
                            </Typography>

                            <Input
                                type="password"
                                label="Password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="dark:text-white"
                                labelProps={{
                                    className: "dark:text-gray-400"
                                }}
                                containerProps={{
                                    className: "min-w-[250px]"
                                }}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>
                    </DialogBody>

                    <DialogFooter className="space-x-2">
                        <Button
                            variant="outlined"
                            onClick={closeModal}
                            className="dark:text-gray-400 dark:border-gray-400 hover:dark:text-white hover:dark:border-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            type="submit"
                            disabled={processing}
                        >
                            Delete Account
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </section>
    );
}
