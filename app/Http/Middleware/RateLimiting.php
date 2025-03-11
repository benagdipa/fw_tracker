<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter as FacadesRateLimiter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Setting;
use Symfony\Component\HttpFoundation\Response;

class RateLimiting
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            // Skip rate limiting for certain paths if needed
            if ($this->shouldSkipRateLimiting($request)) {
                return $next($request);
            }
            
            // Get appropriate rate limit key
            $key = $this->getRateLimitKey($request);
            
            // Get limits from settings or config
            $maxAttempts = $this->getMaxAttempts($request);
            $decayMinutes = $this->getDecayMinutes($request);
            
            // Check if rate limit is exceeded
            if (FacadesRateLimiter::tooManyAttempts($key, $maxAttempts)) {
                // Log excessive requests
                Log::warning('Rate limit exceeded', [
                    'ip' => $request->ip(),
                    'user_id' => Auth::id() ?? 'guest',
                    'path' => $request->path(),
                    'method' => $request->method(),
                    'retry_after' => FacadesRateLimiter::availableIn($key),
                ]);
                
                // Return rate limit response
                return $this->buildRateLimitResponse($key);
            }
            
            // Track this request
            FacadesRateLimiter::hit($key, $decayMinutes);
            
            // Add rate limit headers to the response
            $response = $next($request);
            
            return $this->addRateLimitHeaders($response, $key, $maxAttempts);
        } catch (\Throwable $e) {
            // Log the error but don't block the request if rate limiting fails
            Log::error('Rate limiting error: ' . $e->getMessage(), [
                'exception' => $e,
                'path' => $request->path(),
                'method' => $request->method(),
            ]);
            
            // Continue with the request
            return $next($request);
        }
    }
    
    /**
     * Determine if rate limiting should be skipped for this request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function shouldSkipRateLimiting(Request $request)
    {
        // Whitelisted paths that should never be rate limited
        $whitelist = [
            'api/error/log', // Error logging endpoint
            'health-check',   // Health check endpoint
        ];
        
        foreach ($whitelist as $path) {
            if ($request->is($path)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Generate a rate limit key for the current request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string
     */
    protected function getRateLimitKey(Request $request)
    {
        // If authenticated, use user ID in the key for user-specific limits
        if (Auth::check()) {
            return 'api:' . Auth::id() . ':' . $request->path();
        }
        
        // For guests, use IP address
        return 'api:' . $request->ip() . ':' . $request->path();
    }
    
    /**
     * Get the maximum number of attempts for the current request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return int
     */
    protected function getMaxAttempts(Request $request)
    {
        // Try to get from database settings
        try {
            $settings = Setting::first();
            if ($settings && isset($settings->api_rate_limit)) {
                return (int) $settings->api_rate_limit;
            }
        } catch (\Throwable $e) {
            // If we can't access settings, log the error
            Log::error('Could not retrieve rate limit settings: ' . $e->getMessage());
        }
        
        // Fall back to config or default
        return config('app.rate_limit_requests', 60);
    }
    
    /**
     * Get the decay minutes for the current request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return int
     */
    protected function getDecayMinutes(Request $request)
    {
        return config('app.rate_limit_decay', 60);
    }
    
    /**
     * Build a rate limit exceeded response.
     *
     * @param  string  $key
     * @return \Illuminate\Http\JsonResponse
     */
    protected function buildRateLimitResponse($key)
    {
        $seconds = FacadesRateLimiter::availableIn($key);
        
        return response()->json([
            'error' => 'Too Many Requests',
            'message' => 'Too many requests. Please try again later.',
            'retry_after' => $seconds,
            'retry_after_formatted' => ceil($seconds / 60) . ' minutes',
        ], Response::HTTP_TOO_MANY_REQUESTS)
            ->header('Retry-After', $seconds)
            ->header('X-RateLimit-Reset', now()->addSeconds($seconds)->getTimestamp());
    }
    
    /**
     * Add rate limit headers to the response.
     *
     * @param  \Symfony\Component\HttpFoundation\Response  $response
     * @param  string  $key
     * @param  int  $maxAttempts
     * @return \Symfony\Component\HttpFoundation\Response
     */
    protected function addRateLimitHeaders($response, $key, $maxAttempts)
    {
        $remainingAttempts = FacadesRateLimiter::remaining($key, $maxAttempts);
        
        return $response
            ->header('X-RateLimit-Limit', $maxAttempts)
            ->header('X-RateLimit-Remaining', $remainingAttempts);
    }
} 