import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardBody, Typography, Button } from '@material-tailwind/react';
import {
  FileX2Icon,
  HomeIcon,
  AlertCircleIcon,
  ServerCrashIcon,
  ShieldAlertIcon,
  RotateCcwIcon
} from 'lucide-react';

export default function Error({ status, message }) {
  const title = {
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Page Not Found',
    500: 'Server Error',
    503: 'Service Unavailable',
  }[status] || 'Error';

  const description = message || {
    401: 'You do not have permission to access this resource.',
    403: 'You are forbidden from accessing this resource.',
    404: 'The page you are looking for does not exist or has been moved.',
    500: 'We encountered an unexpected error on our servers.',
    503: 'The service is temporarily unavailable. Please try again later.',
  }[status] || 'An unexpected error occurred.';

  const Icon = {
    401: ShieldAlertIcon,
    403: ShieldAlertIcon,
    404: FileX2Icon,
    500: ServerCrashIcon,
    503: ServerCrashIcon,
  }[status] || AlertCircleIcon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Head title={`${status} | ${title}`} />
      
      <Card className="max-w-lg w-full">
        <CardBody className="flex flex-col items-center text-center p-8">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <Icon className="h-10 w-10 text-red-500" />
          </div>
          
          <Typography variant="h2" className="text-3xl font-bold text-gray-900 mb-2">
            {status} | {title}
          </Typography>
          
          <Typography className="text-gray-600 mb-8 max-w-md">
            {description}
          </Typography>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              color="blue"
              size="lg"
              className="flex items-center gap-2"
              onClick={() => window.location.reload()}
            >
              <RotateCcwIcon className="h-4 w-4" />
              Try Again
            </Button>
            
            <Link href="/">
              <Button
                variant="outlined"
                color="blue"
                size="lg"
                className="flex items-center gap-2"
              >
                <HomeIcon className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 