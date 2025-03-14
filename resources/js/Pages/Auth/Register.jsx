import React, { useEffect } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";
import { Button } from "@material-tailwind/react";

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  useEffect(() => {
    return () => {
      reset("password", "password_confirmation");
    };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    post(route("register"));
  };

  return (
    <GuestLayout>
      <Head title="Create Account" />

      <form onSubmit={submit} className="space-y-5">
        <div>
          <InputLabel htmlFor="name" value="Full Name" className="text-gray-700 dark:text-gray-300 font-medium mb-1" />

          <TextInput
            id="name"
            name="name"
            value={data.name}
            className="mt-1 block w-full modern-input"
            autoComplete="name"
            isFocused={true}
            onChange={(e) => setData("name", e.target.value)}
            required
            placeholder="Enter your full name"
          />

          <InputError message={errors.name} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="email" value="Email Address" className="text-gray-700 dark:text-gray-300 font-medium mb-1" />

          <TextInput
            id="email"
            type="email"
            name="email"
            value={data.email}
            className="mt-1 block w-full modern-input"
            autoComplete="username"
            onChange={(e) => setData("email", e.target.value)}
            required
            placeholder="Enter your email address"
          />

          <InputError message={errors.email} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="password" value="Password" className="text-gray-700 dark:text-gray-300 font-medium mb-1" />

          <TextInput
            id="password"
            type="password"
            name="password"
            value={data.password}
            className="mt-1 block w-full modern-input"
            autoComplete="new-password"
            onChange={(e) => setData("password", e.target.value)}
            required
            placeholder="Create a password"
          />

          <InputError message={errors.password} className="mt-2" />
        </div>

        <div>
          <InputLabel
            htmlFor="password_confirmation"
            value="Confirm Password"
            className="text-gray-700 dark:text-gray-300 font-medium mb-1"
          />

          <TextInput
            id="password_confirmation"
            type="password"
            name="password_confirmation"
            value={data.password_confirmation}
            className="mt-1 block w-full modern-input"
            autoComplete="new-password"
            onChange={(e) => setData("password_confirmation", e.target.value)}
            required
            placeholder="Confirm your password"
          />

          <InputError message={errors.password_confirmation} className="mt-2" />
        </div>

        <div className="pt-2">
          <Button
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
            disabled={processing}
            type="submit"
          >
            {processing ? "Creating Account..." : "Create Account"}
          </Button>
        </div>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link 
              href={route("login")} 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </GuestLayout>
  );
}
