import React, { useEffect, useState, useCallback } from "react";
import Checkbox from "@/Components/Checkbox";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Button } from "@material-tailwind/react";
import axios from 'axios';

export default function Login({ status, canResetPassword }) {
  const [csrfError, setCsrfError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const page = usePage();
  const pageToken = page.props.csrf_token;
  
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
  
  // Pre-fetch a fresh CSRF token on component mount
  useEffect(() => {
    const initializeToken = async () => {
      try {
        if (window.refreshCsrfToken) {
          const token = await window.refreshCsrfToken(true);
          if (!token) {
            console.warn("Could not retrieve a CSRF token on page load");
            setCsrfError(true);
          } else {
            console.log("Successfully initialized CSRF token");
            setCsrfError(false);
          }
        }
      } catch (error) {
        console.error("Error initializing CSRF token:", error);
        setCsrfError(true);
      }
    };
    
    initializeToken();
  }, []);
  
  // Get the most reliable CSRF token - now without hooks inside
  const getReliableToken = useCallback(() => {
    // Try from Inertia page props first
    
    // Next try meta tag
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.content;
    
    // Then try window.Laravel if it exists
    const laravelToken = window.Laravel?.csrfToken;
    
    // Finally try cookie
    const getCookieToken = () => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; XSRF-TOKEN=`);
      if (parts.length === 2) {
        const xsrfToken = parts.pop().split(';').shift();
        try {
          return decodeURIComponent(xsrfToken);
        } catch (e) {
          return xsrfToken;
        }
      }
      return null;
    };
    
    const cookieToken = getCookieToken();
    
    // Use the first available token
    return pageToken || metaToken || laravelToken || cookieToken || '';
  }, [pageToken]);

  const submit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log("Already submitting, please wait...");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      setLoginAttempts(prev => prev + 1);
      
      // Always refresh CSRF token before submission
      let token;
      try {
        token = await window.refreshCsrfToken(true);
      } catch (error) {
        console.error("Error refreshing token before submission:", error);
        token = getReliableToken();
      }
      
      if (!token) {
        console.warn("No CSRF token available for form submission");
        setCsrfError(true);
        setIsSubmitting(false);
        return;
      }
      
      // Use direct axios request first for better control over headers
      if (loginAttempts > 0) {
        try {
          console.log("Trying direct axios login");
          const response = await axios.post(route("login"), {
            email: data.email,
            password: data.password,
            remember: data.remember ? 1 : 0,
            _token: token
          }, {
            headers: {
              'X-CSRF-TOKEN': token,
              'X-XSRF-TOKEN': token,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            withCredentials: true
          });
          
          if (response.status >= 200 && response.status < 300) {
            // Success! Redirect to intended location
            window.location.href = response.data.redirect || '/dashboard';
            return;
          }
        } catch (error) {
          console.error("Direct axios login failed:", error);
          // Continue to try Inertia method
        }
      }
      
      // Fall back to Inertia's post method
      post(route("login"), {
        preserveScroll: true,
        onSuccess: () => {
          setCsrfError(false);
        },
        onError: async (errors) => {
          // Check for CSRF token errors
          if (errors.hasOwnProperty('csrf') || 
              (errors.hasOwnProperty('error') && errors.error.includes('CSRF')) ||
              window.axios?.lastError?.response?.status === 419) {
            
            console.warn('CSRF error detected, trying to handle it');
            setCsrfError(true);
            
            try {
              // Try refreshing the token
              const refreshed = await window.refreshCsrfToken(true);
              
              if (refreshed) {
                console.log("Successfully refreshed token, retrying login");
                // Wait a moment to ensure the token is properly set
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Try the login again with fresh token
                post(route("login"), {
                  preserveScroll: true,
                  onSuccess: () => setCsrfError(false)
                });
                return;
              }
            } catch (error) {
              console.error("Error refreshing token:", error);
            }
            
            console.warn('Token refresh failed, falling back to direct form submission');
            
            // Create and submit a backup form
            submitBackupForm();
          }
        },
        onFinish: () => {
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      setIsSubmitting(false);
    }
  };

  // Fallback direct form submission as a last resort
  const submitBackupForm = () => {
    try {
      console.log("Using backup form submission method");
      
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
      
      // Get the token 
      const tokenValue = getReliableToken();
      
      // Add the CSRF token
      const tokenField = document.createElement('input');
      tokenField.type = 'hidden';
      tokenField.name = '_token';
      tokenField.value = tokenValue;
      form.appendChild(tokenField);
      
      // Submit the form
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error("Backup form submission failed:", error);
      setIsSubmitting(false);
    }
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
          There was an issue with your session security token. Please try again.
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* Hidden CSRF token field */}
        <input 
          type="hidden" 
          name="_token" 
          value={getReliableToken()}
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
            disabled={processing || isSubmitting}
            type="submit"
          >
            {(processing || isSubmitting) ? "Signing in..." : "Sign In"}
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
