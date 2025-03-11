import React, { useEffect, useState } from "react";
import Checkbox from "@/Components/Checkbox";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Button } from "@material-tailwind/react";

export default function Login({ status, canResetPassword }) {
  const [csrfError, setCsrfError] = useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  useEffect(() => {
    return () => {
      reset("password");
    };
  }, []);
  
  // Function to refresh CSRF token
  const refreshCsrfToken = async () => {
    try {
      const response = await fetch('/refresh-csrf', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          // Update meta tag with new token
          const metaToken = document.head.querySelector('meta[name="csrf-token"]');
          if (metaToken) {
            metaToken.content = data.token;
          }
          
          // Also update axios headers
          if (window.axios) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = data.token;
            window.axios.defaults.headers.common['X-XSRF-TOKEN'] = data.token;
          }
          
          console.log('CSRF token refreshed successfully');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error refreshing CSRF token:', error);
      return false;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    
    // If we previously had a CSRF error, try to refresh the token first
    if (csrfError) {
      await refreshCsrfToken();
    }
    
    // Try the standard Inertia submission
    post(route("login"), {
      onError: async (errors) => {
        // If we get a specific CSRF error or the server responds with 419
        if (errors.hasOwnProperty('csrf') || 
            (errors.hasOwnProperty('error') && errors.error.includes('CSRF')) ||
            window.axios?.lastError?.response?.status === 419) {
          
          console.warn('CSRF error detected, trying to handle it');
          setCsrfError(true);
          
          // Try to refresh the token
          const refreshed = await refreshCsrfToken();
          
          if (refreshed) {
            // Try again with the new token
            post(route("login"));
            return;
          }
          
          console.warn('Token refresh failed, falling back to direct form submission');
          
          // Create a backup form and submit it directly
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = route("login");
          form.style.display = 'none';
          
          // Add the email field
          const emailField = document.createElement('input');
          emailField.type = 'email';
          emailField.name = 'email';
          emailField.value = data.email;
          form.appendChild(emailField);
          
          // Add the password field
          const passwordField = document.createElement('input');
          passwordField.type = 'password';
          passwordField.name = 'password';
          passwordField.value = data.password;
          form.appendChild(passwordField);
          
          // Add the remember field if checked
          if (data.remember) {
            const rememberField = document.createElement('input');
            rememberField.type = 'checkbox';
            rememberField.name = 'remember';
            rememberField.checked = true;
            form.appendChild(rememberField);
          }
          
          // Get the latest token from various sources
          const tokenValue = 
            document.querySelector('meta[name="csrf-token"]')?.content || 
            usePage().props.csrf_token || 
            '';
          
          // Add the CSRF token
          const tokenField = document.createElement('input');
          tokenField.type = 'hidden';
          tokenField.name = '_token';
          tokenField.value = tokenValue;
          form.appendChild(tokenField);
          
          // Submit the form
          document.body.appendChild(form);
          form.submit();
        }
      }
    });
  };

  return (
    <GuestLayout>
      <Head title="Sign In" />

      {status && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
          {status}
        </div>
      )}

      {csrfError && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium">
          There was an issue with your session. Please try again.
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* Hidden CSRF token field */}
        <input 
          type="hidden" 
          name="_token" 
          value={usePage().props.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content || ''}
        />
        
        <div>
          <InputLabel htmlFor="email" value="Email Address" className="text-gray-700 dark:text-gray-300 font-medium mb-1" />

          <TextInput
            id="email"
            type="email"
            name="email"
            value={data.email}
            className="mt-1 block w-full modern-input"
            autoComplete="username"
            isFocused={true}
            onChange={(e) => setData("email", e.target.value)}
            placeholder="Enter your email"
          />

          <InputError message={errors.email} className="mt-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <InputLabel htmlFor="password" value="Password" className="text-gray-700 dark:text-gray-300 font-medium" />
            
            {canResetPassword && (
              <Link
                href={route("password.request")}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            )}
          </div>

          <TextInput
            id="password"
            type="password"
            name="password"
            value={data.password}
            className="mt-1 block w-full modern-input"
            autoComplete="current-password"
            onChange={(e) => setData("password", e.target.value)}
            placeholder="Enter your password"
          />

          <InputError message={errors.password} className="mt-2" />
        </div>

        <div className="flex items-center">
          <label className="flex items-center">
            <Checkbox
              name="remember"
              checked={data.remember}
              onChange={(e) => setData("remember", e.target.checked)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              Remember me
            </span>
          </label>
        </div>

        <div>
          <Button
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
            disabled={processing}
            type="submit"
          >
            {processing ? "Signing in..." : "Sign In"}
          </Button>
        </div>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link 
              href={route("register")} 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </form>
    </GuestLayout>
  );
}
