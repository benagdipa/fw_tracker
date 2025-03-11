<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ToolsManagerController extends Controller
{
    /**
     * Display the tools manager page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        return Inertia::render('ToolsManager/Index', [
            'title' => 'Tools Manager',
            'tools' => $this->getAvailableTools(),
        ]);
    }

    /**
     * Get the list of available tools for the current user.
     *
     * @return array
     */
    private function getAvailableTools()
    {
        // This would typically be fetched from a database or configuration
        return [
            [
                'id' => 'wntd',
                'name' => 'WNTD',
                'description' => 'What\'s New Technology Database',
                'icon' => 'DatabaseIcon',
                'route' => 'wntd.field.name.index',
            ],
            [
                'id' => 'implementation-tracker',
                'name' => 'Implementation Tracker',
                'description' => 'Track implementation progress',
                'icon' => 'ChartBarIcon',
                'route' => 'implementation.field.name.index',
            ],
            [
                'id' => 'ran-configuration',
                'name' => 'RAN Configuration',
                'description' => 'Manage RAN configurations',
                'icon' => 'CogIcon',
                'route' => 'ran.configuration.index',
            ],
        ];
    }
} 