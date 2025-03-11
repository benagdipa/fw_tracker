<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Allow access to users with super-admin or admin roles
        if (auth()->check() && (
            auth()->user()->hasRole('super-admin') || 
            auth()->user()->hasRole('admin')
        )) {
            return $next($request);
        }

        // Redirect to dashboard with unauthorized message
        return redirect()->route('dashboard')->with('error', 'You do not have permission to access this area.');
    }
} 