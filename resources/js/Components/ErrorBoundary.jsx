import React from 'react';
import { Typography, Button, Card } from '@material-tailwind/react';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';
import { logError } from '@/Utils/ErrorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the server and to the console
    console.error("Component error:", error, errorInfo);
    
    // Generate a unique error ID to help with debugging
    const errorId = `err-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.setState({ errorInfo, errorId });
    
    // Log the error to the server if available
    try {
      logError({
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href
      });
    } catch (e) {
      // If logging fails, just log to console
      console.error("Failed to log error to server:", e);
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI
      return (
        <Card className="p-6 bg-red-50 border border-red-200">
          <div className="flex flex-col items-center text-center p-4">
            <BugReportIcon className="text-red-500 w-16 h-16 mb-4" />
            <Typography variant="h5" className="text-red-800 mb-2">
              Something went wrong
            </Typography>
            <Typography className="text-red-700 mb-4">
              {this.state.error && this.state.error.message}
              {this.state.errorId && (
                <div className="mt-2 text-sm text-gray-600">
                  Error ID: {this.state.errorId}
                </div>
              )}
            </Typography>
            
            <div className="flex gap-4 mt-4">
              <Button
                color="red"
                variant="outlined"
                className="flex items-center gap-2"
                onClick={this.resetError}
              >
                <RefreshIcon fontSize="small" /> Try Again
              </Button>
              <Button
                color="blue"
                variant="outlined"
                className="flex items-center gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshIcon fontSize="small" /> Reload Page
              </Button>
            </div>
            
            {this.props.showDetails && this.state.errorInfo && (
              <details className="mt-4 text-left w-full">
                <summary className="cursor-pointer text-blue-700 mb-2">
                  Technical Details
                </summary>
                <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </Card>
      );
    }

    // If no error, render children
    return this.props.children;
  }
}

export default ErrorBoundary; 