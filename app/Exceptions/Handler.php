<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Client\HttpClientException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use ErrorException;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // Rate limiting for error logging to prevent log flooding
            $errorHash = md5(get_class($e) . $e->getFile() . $e->getLine() . $e->getMessage());
            $cacheKey = 'error_log_' . $errorHash;
            
            if (!Cache::has($cacheKey)) {
                // Enhanced error logging with more context
                Log::error('Application Error: ' . $e->getMessage(), [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                    'user_id' => auth()->id() ?? 'unauthenticated',
                    'environment' => App::environment(),
                    'request_url' => request()->fullUrl(),
                    'request_method' => request()->method(),
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
                
                // Cache this error for 5 minutes to prevent repeated logging
                Cache::put($cacheKey, true, now()->addMinutes(5));
            }
        });

        // Handle 404 errors
        $this->renderable(function (NotFoundHttpException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Resource not found'], 404);
            }
            
            return Inertia::render('Errors/NotFound', [
                'status' => 404,
                'message' => 'The requested resource could not be found.',
            ])->toResponse($request)->setStatusCode(404);
        });
        
        // Handle authorization errors
        $this->renderable(function (AuthorizationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'You are not authorized to access this resource'], 403);
            }
            
            return Inertia::render('Errors/Error', [
                'status' => 403,
                'message' => 'You do not have permission to access this resource.',
            ])->toResponse($request)->setStatusCode(403);
        });
        
        // Handle authentication errors
        $this->renderable(function (AuthenticationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Authentication required'], 401);
            }
            
            return redirect()->guest(route('login'))->with('error', 'Please log in to continue.');
        });
        
        // Handle validation errors
        $this->renderable(function (ValidationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });
        
        // Handle CSRF token mismatches
        $this->renderable(function (TokenMismatchException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Session expired, please refresh and try again'], 419);
            }
            
            return redirect()->back()
                ->withInput($request->except('_token'))
                ->with('error', 'Your session has expired. Please try again.');
        });
        
        // Handle database errors
        $this->renderable(function (QueryException $e, $request) {
            // Log the database error specifically
            Log::error('Database Error: ' . $e->getMessage(), [
                'sql' => $e->getSql() ?? null, // getSql may not be available
                'bindings' => method_exists($e, 'getBindings') ? $e->getBindings() : [],
                'code' => $e->getCode(),
                'query' => method_exists($e, 'getQuery') ? $e->getQuery() : null,
            ]);
            
            if ($request->expectsJson()) {
                return response()->json(['message' => 'A database error occurred'], 500);
            }
            
            return Inertia::render('Errors/Error', [
                'status' => 500,
                'message' => 'A database error occurred. Our team has been notified.',
            ])->toResponse($request)->setStatusCode(500);
        });
        
        // Handle network connection errors
        $this->renderable(function (ConnectionException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'A connection error occurred. Please try again later.'], 503);
            }
            
            return Inertia::render('Errors/Error', [
                'status' => 503,
                'message' => 'A connection error occurred. Please try again later.',
            ])->toResponse($request)->setStatusCode(503);
        });
        
        // Handle HTTP client exceptions (like API timeouts)
        $this->renderable(function (RequestException $e, $request) {
            $statusCode = $e->response ? $e->response->status() : 500;
            $message = 'An error occurred with an external service.';
            
            // Log API failure details
            Log::error('API Request Failed: ' . $e->getMessage(), [
                'url' => $e->response?->effectiveUri() ?? 'unknown',
                'status' => $statusCode,
                'response' => $e->response ? substr($e->response->body(), 0, 500) : null
            ]);
            
            if ($request->expectsJson()) {
                return response()->json(['message' => $message], $statusCode);
            }
            
            return Inertia::render('Errors/Error', [
                'status' => $statusCode,
                'message' => $message,
            ])->toResponse($request)->setStatusCode($statusCode);
        });
        
        // Handle rate limiting errors
        $this->renderable(function (TooManyRequestsHttpException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Too many requests. Please try again later.',
                    'retry_after' => $e->getHeaders()['Retry-After'] ?? 60,
                ], 429);
            }
            
            return Inertia::render('Errors/Error', [
                'status' => 429,
                'message' => 'Too many requests. Please try again later.',
            ])->toResponse($request)->setStatusCode(429);
        });
        
        // Handle PHP errors
        $this->renderable(function (ErrorException $e, $request) {
            Log::error('PHP Error: ' . $e->getMessage(), [
                'severity' => $e->getSeverity(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            if ($request->expectsJson()) {
                return response()->json(['message' => 'An internal server error occurred'], 500);
            }
            
            if (!config('app.debug')) {
                return Inertia::render('Errors/Error', [
                    'status' => 500,
                    'message' => 'An internal server error occurred. Our team has been notified.',
                ])->toResponse($request)->setStatusCode(500);
            }
        });
        
        // Handle other HTTP exceptions
        $this->renderable(function (HttpException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage() ?: 'Http Error'], $e->getStatusCode());
            }
            
            return Inertia::render('Errors/Error', [
                'status' => $e->getStatusCode(),
                'message' => $e->getMessage() ?: 'An error occurred.',
            ])->toResponse($request)->setStatusCode($e->getStatusCode());
        });
        
        // Default exception handler for Inertia
        $this->renderable(function (Throwable $e, $request) {
            // Skip if handled by previous renderers or in debug mode for web (to show debug page)
            if ($this->shouldReturnJson($request, $e) || (!$request->header('X-Inertia') && config('app.debug'))) {
                return;
            }

            // For Inertia requests or production
            if ($request->header('X-Inertia') || !config('app.debug')) {
                return Inertia::render('Errors/Error', [
                    'status' => 500,
                    'message' => 'Something went wrong on our end. Our team has been notified.',
                ])->toResponse($request)->setStatusCode(500);
            }
        });
    }
} 