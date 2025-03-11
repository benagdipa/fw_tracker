<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as BaseVerifier;

class VerifyCsrfToken extends BaseVerifier
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'sanctum/csrf-cookie',  // Allow refreshing the CSRF token
        'refresh-csrf',         // Our custom CSRF refresh endpoint
        'api/external/*',       // Exclude external API endpoints
        'check-csrf',           // Our debugging endpoint
        // Temporary fix for login issues - remove after testing
        'login',                
        'dashboard',
        'api/refresh-csrf-token',
        'api/log-client-error',
        'api/error/log'
    ];
}
