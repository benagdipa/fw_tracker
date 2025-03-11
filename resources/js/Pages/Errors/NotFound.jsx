import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardBody, Typography, Button } from '@material-tailwind/react';
import { FileX2Icon, HomeIcon, SearchIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Head title="404 | Page Not Found" />
      
      <Card className="max-w-lg w-full">
        <CardBody className="flex flex-col items-center text-center p-8">
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <FileX2Icon className="h-12 w-12 text-blue-500" />
          </div>
          
          <Typography variant="h2" className="text-3xl font-bold text-gray-900 mb-2">
            404 | Page Not Found
          </Typography>
          
          <Typography className="text-gray-600 mb-8 max-w-md">
            Oops! The page you are looking for might have been removed, had its name changed, 
            or is temporarily unavailable.
          </Typography>
          
          <div className="w-full max-w-md p-4 bg-blue-50 rounded-lg mb-8">
            <Typography variant="small" className="text-blue-800">
              You might want to check if:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The URL was typed correctly</li>
                <li>The page has been moved or deleted</li>
                <li>You have permission to access this resource</li>
              </ul>
            </Typography>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/">
              <Button
                color="blue"
                size="lg"
                className="flex items-center gap-2"
              >
                <HomeIcon className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            
            <Button
              variant="outlined"
              color="blue"
              size="lg"
              className="flex items-center gap-2"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 