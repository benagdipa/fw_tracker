<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ErrorController extends Controller
{
    /**
     * Show a generic error page
     *
     * @param  int  $code
     * @return \Inertia\Response
     */
    public function show($code = 500)
    {
        $message = $this->getMessageForCode($code);
        
        return Inertia::render('Errors/Error', [
            'status' => $code,
            'message' => $message,
        ]);
    }
    
    /**
     * Get the appropriate message for the error code
     *
     * @param  int  $code
     * @return string
     */
    private function getMessageForCode($code)
    {
        return match (intval($code)) {
            401 => 'You need to be authenticated to access this resource.',
            403 => 'You do not have permission to access this resource.',
            404 => 'The requested resource could not be found.',
            419 => 'Your session has expired. Please refresh and try again.',
            429 => 'Too many requests. Please try again later.',
            500 => 'An unexpected error occurred. Our team has been notified.',
            503 => 'The service is temporarily unavailable. Please try again later.',
            default => 'An error occurred.',
        };
    }

    /**
     * Log client-side errors
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function logClientError(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'message' => 'required|string|max:2000',
                'context' => 'nullable|string|max:1000',
                'url' => 'nullable|string|max:1000',
                'userAgent' => 'nullable|string|max:1000',
                'stack' => 'nullable|string|max:10000',
                'componentStack' => 'nullable|string|max:10000',
                'errorId' => 'nullable|string|max:255',
                'timestamp' => 'nullable|string|max:100',
                'additionalData' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Invalid error report format', 
                    'details' => $validator->errors()
                ], 400);
            }

            $data = $request->all();
            $errorId = $data['errorId'] ?? ('server-generated-' . uniqid());
            
            // Log the error
            Log::error('Client-side error: ' . $data['message'], [
                'error_id' => $errorId,
                'context' => $data['context'] ?? 'Unknown',
                'url' => $data['url'] ?? request()->header('Referer') ?? 'Unknown',
                'userAgent' => $data['userAgent'] ?? request()->header('User-Agent') ?? 'Unknown',
                'stack' => $data['stack'] ?? 'No stack trace provided',
                'componentStack' => $data['componentStack'] ?? null,
                'ip' => $request->ip(),
                'user_id' => auth()->id() ?? 'unauthenticated',
                'user_email' => auth()->user()->email ?? 'unknown',
                'timestamp' => $data['timestamp'] ?? now()->toIso8601String(),
                'additionalData' => $data['additionalData'] ?? [],
                'route' => request()->route() ? request()->route()->getName() : 'unknown',
                'method' => request()->method(),
                'headers' => collect(request()->header())->only(['accept', 'accept-language', 'user-agent', 'referer'])->toArray(),
            ]);

            return response()->json([
                'message' => 'Error logged successfully',
                'errorId' => $errorId
            ], 200);
        } catch (\Throwable $e) {
            // Log if there's an error in the error logger itself
            Log::error('Error in error logger: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json(['message' => 'Failed to log error'], 500);
        }
    }
} 