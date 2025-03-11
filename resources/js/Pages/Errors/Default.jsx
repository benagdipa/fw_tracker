import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardBody, Typography, Button } from '@material-tailwind/react';
import { AlertCircleIcon, HomeIcon, RotateCcwIcon } from 'lucide-react';

export default function Default({ error, status }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Head title="Error" />
      
      <Card className="max-w-lg w-full">
        <CardBody className="flex flex-col items-center text-center p-8">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertCircleIcon className="h-10 w-10 text-red-500" />
          </div>
          
          <Typography variant="h2" className="text-3xl font-bold text-gray-900 mb-2">
            Something went wrong
          </Typography>
          
          <Typography className="text-gray-600 mb-8 max-w-md">
            We've encountered an unexpected error while processing your request.
            Our team has been notified and is working on the issue.
          </Typography>
          
          {error && process.env.NODE_ENV === 'development' && (
            <Card className="w-full mb-6 bg-red-50 border border-red-100">
              <CardBody className="p-4">
                <Typography variant="small" className="font-medium text-red-700 mb-1">
                  Error Details (visible in development only):
                </Typography>
                <Typography variant="small" className="text-red-600 font-mono overflow-auto text-left">
                  {error.message}
                </Typography>
              </CardBody>
            </Card>
          )}
          
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