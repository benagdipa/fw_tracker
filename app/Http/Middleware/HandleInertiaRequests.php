<?php

namespace App\Http\Middleware;

use App\Models\Entity;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $roleName = 'user';
        $user = $request->user();

        if ($user && $user->roles->isNotEmpty()) {
            $roleName = $user->roles->first()->name;
        }
        return array_merge(
            parent::share($request),
            [
                'auth' => [
                    'user' => $request->user(),
                    'role' => $roleName,
                ],
                'csrf_token' => csrf_token(),
                'batch' => [
                    'batch_site_id' => session('batch_site_id') ? session('batch_site_id') : null,
                    'batch_field_id' => session('batch_field_id') ? session('batch_field_id') : null,
                ],
                'entities' => Entity::where('user_id', $user ? $user->id : null)->get(['id', 'title', 'slug']),
                'ziggy' => fn() => array_merge(
                    (new Ziggy)->toArray(),
                    ['location' => $request->url()]
                ),
            ]
        );
    }
}
