import { useRef, useState } from 'react';
import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { 
    Typography, 
    Button, 
    Input,
    Card,
    Progress,
    Alert
} from '@material-tailwind/react';
import { CheckIcon, KeyIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [strengthColor, setStrengthColor] = useState('red');
    const [passwordFeedback, setPasswordFeedback] = useState('');

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    // Password strength checker
    const checkPasswordStrength = (password) => {
        // Update the password in the form data
        setData('password', password);
        
        if (!password) {
            setPasswordStrength(0);
            setStrengthColor('red');
            setPasswordFeedback('');
            return;
        }

        // Check password strength
        let strength = 0;
        let feedback = '';

        // Length check
        if (password.length >= 8) {
            strength += 25;
        } else {
            feedback = 'Password should be at least 8 characters long';
        }

        // Contains uppercase
        if (/[A-Z]/.test(password)) {
            strength += 25;
        } else if (!feedback) {
            feedback = 'Add uppercase letters for stronger password';
        }

        // Contains numbers
        if (/[0-9]/.test(password)) {
            strength += 25;
        } else if (!feedback) {
            feedback = 'Add numbers for stronger password';
        }

        // Contains special characters
        if (/[^A-Za-z0-9]/.test(password)) {
            strength += 25;
        } else if (!feedback) {
            feedback = 'Add special characters for stronger password';
        }

        // Set the appropriate color for the strength indicator
        if (strength < 50) {
            setStrengthColor('red');
            if (!feedback) feedback = 'Password is weak';
        } else if (strength < 75) {
            setStrengthColor('amber');
            if (!feedback) feedback = 'Password strength is moderate';
        } else {
            setStrengthColor('green');
            if (!feedback) feedback = 'Password strength is good';
        }

        setPasswordStrength(strength);
        setPasswordFeedback(feedback);
    };

    return (
        <section className={className}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                    <Typography variant="h4" className="font-semibold text-gray-900 dark:text-white">
                        Update Password
                    </Typography>
                    <Typography className="mt-1 text-gray-600 dark:text-gray-400">
                        Ensure your account is using a long, random password to stay secure.
                    </Typography>
                </div>
            </div>

            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-8">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                        <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                        <Typography color="blue" variant="h6">
                            Password Security Tips
                        </Typography>
                        <ul className="list-disc list-inside mt-2 text-blue-700 dark:text-blue-300 text-sm space-y-1">
                            <li>Use at least 8 characters</li>
                            <li>Include uppercase and lowercase letters</li>
                            <li>Add numbers and special characters</li>
                            <li>Don't reuse passwords from other sites</li>
                            <li>Update your password regularly</li>
                        </ul>
                    </div>
                </div>
            </Card>

            <form onSubmit={updatePassword} className="space-y-6 max-w-xl">
                <div>
                    <Input
                        type="password"
                        label="Current Password"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        ref={currentPasswordInput}
                        className="dark:text-white"
                        labelProps={{
                            className: "dark:text-gray-400"
                        }}
                        containerProps={{
                            className: "min-w-[250px]"
                        }}
                    />
                    <InputError message={errors.current_password} className="mt-2" />
                </div>

                <div>
                    <Input
                        type="password"
                        label="New Password"
                        value={data.password}
                        onChange={(e) => checkPasswordStrength(e.target.value)}
                        ref={passwordInput}
                        className="dark:text-white"
                        labelProps={{
                            className: "dark:text-gray-400"
                        }}
                        containerProps={{
                            className: "min-w-[250px]"
                        }}
                    />
                    
                    {data.password && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                                <Typography variant="small" color={strengthColor}>
                                    Password Strength
                                </Typography>
                                <Typography variant="small" color={strengthColor}>
                                    {passwordStrength}%
                                </Typography>
                            </div>
                            <Progress value={passwordStrength} color={strengthColor} className="h-1" />
                            {passwordFeedback && (
                                <Typography variant="small" color="gray" className="mt-1">
                                    {passwordFeedback}
                                </Typography>
                            )}
                        </div>
                    )}
                    
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <Input
                        type="password"
                        label="Confirm Password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        className="dark:text-white"
                        labelProps={{
                            className: "dark:text-gray-400"
                        }}
                        containerProps={{
                            className: "min-w-[250px]"
                        }}
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
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
