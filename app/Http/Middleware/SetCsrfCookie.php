<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;

class SetCsrfCookie
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
        $response = $next($request);
        
        // Ensure a valid CSRF token is always available
        if (!$request->cookies->has('XSRF-TOKEN')) {
            $response->withCookie(
                Cookie::make('XSRF-TOKEN', csrf_token(), 120, '/', null, false, false, false, 'lax')
            );
        }
        
        return $response;
    }
} 