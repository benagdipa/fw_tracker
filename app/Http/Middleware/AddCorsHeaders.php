<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AddCorsHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  \
     * @param  \Closure  \
     * @return mixed
     */
    public function handle(Request \, Closure \)
    {
        \ = \(\);
        
        // Don't add headers if already added by another middleware
        if (!\->headers->has('Access-Control-Allow-Origin')) {
            \->header('Access-Control-Allow-Origin', \->header('Origin') ? \->header('Origin') : '*');
            \->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            \->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-TOKEN, X-XSRF-TOKEN');
            \->header('Access-Control-Allow-Credentials', 'true');
            \->header('Access-Control-Max-Age', '86400');
        }
        
        return \;
    }
}
