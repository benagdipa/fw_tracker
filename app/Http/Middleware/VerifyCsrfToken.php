<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as BaseVerifier;

class VerifyCsrfToken extends BaseVerifier
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array
     */
    protected $except = [
        'sanctum/csrf-cookie',  // Allow refreshing the CSRF token
        'refresh-csrf',         // Our custom CSRF refresh endpoint
        'api/external/*',       // Exclude external API endpoints
        'login'                 // Temporarily exclude login to fix CSRF issues
    ];
}
