<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\JobBatch;
use App\Models\WNTD;
use App\Models\User;
use Illuminate\Http\Request;
use App\Models\Implementation;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PageController extends Controller
{
    public function dashboard()
    {
        try {
            // Core stats for the top metrics cards
            $stats = [
                // Implementation statistics
                'implementations' => [
                    'total' => $this->safeCount(Implementation::class),
                    'in_progress' => $this->safeCount(Implementation::class, ['status' => 'in_progress']),
                    'completed' => $this->safeCount(Implementation::class, ['status' => 'completed']),
                    'pending' => $this->safeCount(Implementation::class, ['status' => 'not_started']),
                    'recent' => $this->safeCount(Implementation::class, [['created_at', '>=', Carbon::now()->subDays(7)]]),
                    'trend' => $this->safeMethod(function() { return $this->calculateTrend('implementations'); }, ['percentage' => 0, 'direction' => 'stable'])
                ],
                
                // WNTD statistics
                'wntd' => [
                    'total' => $this->safeMethod(function() { 
                        return WNTD::whereNotNull('wntd')->distinct('wntd')->count();
                    }, 0),
                    'unique_versions' => $this->safeMethod(function() { 
                        return WNTD::whereNotNull('version')->distinct('version')->count();
                    }, 0),
                    'recent' => $this->safeCount(WNTD::class, [['created_at', '>=', Carbon::now()->subDays(7)]]),
                    'trend' => $this->safeMethod(function() { return $this->calculateTrend('wntd'); }, ['percentage' => 0, 'direction' => 'stable'])
                ],
                
                // User statistics
                'users' => [
                    'total' => $this->safeCount(User::class),
                    'active' => $this->safeCount(User::class, [['created_at', '>=', Carbon::now()->subDays(30)]]),
                    'by_role' => $this->safeMethod(function() { return $this->getUserCountByRole(); }, [])
                ]
            ];
            
            // Get implementation status distribution
            $implementationStatusDistribution = [
                [
                    'label' => 'In Progress',
                    'value' => $stats['implementations']['in_progress'],
                    'color' => '#3B82F6' // blue
                ],
                [
                    'label' => 'Completed',
                    'value' => $stats['implementations']['completed'],
                    'color' => '#10B981' // green
                ],
                [
                    'label' => 'Pending',
                    'value' => $stats['implementations']['pending'],
                    'color' => '#F59E0B' // amber
                ]
            ];
            
            // Recent activities (implementations, WNTD updates, user logins)
            $recentActivities = $this->safeMethod(function() { 
                return $this->getRecentActivities(); 
            }, collect([]));
            
            // Recent implementations
            $recentImplementations = $this->safeMethod(function() {
                return Implementation::with(['tracking' => function($query) {
                        $query->orderBy('created_at', 'desc');
                    }])
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(function($implementation) {
                        $status = $implementation->status;
                        return [
                            'id' => $implementation->id,
                            'site_name' => $implementation->site_name,
                            'cell_name' => $implementation->cell_name,
                            'status' => $status,
                            'date' => $implementation->created_at->diffForHumans(),
                            'color' => $status === 'completed' ? 'green' : 
                                    ($status === 'in_progress' ? 'blue' : 'amber')
                        ];
                    });
            }, collect([]));
            
            // Get monthly implementation trend
            $monthlyTrend = $this->safeMethod(function() { 
                return $this->getMonthlyImplementationTrend(); 
            }, collect([]));
                
            return Inertia::render('Dashboard', [
                'stats' => $stats,
                'implementationStatusDistribution' => $implementationStatusDistribution,
                'recentActivities' => $recentActivities,
                'recentImplementations' => $recentImplementations,
                'monthlyTrend' => $monthlyTrend
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Render a simplified dashboard with error message
            return Inertia::render('Dashboard', [
                'error' => 'There was an error loading the dashboard. Please try again later.',
                'stats' => [
                    'implementations' => ['total' => 0, 'in_progress' => 0, 'completed' => 0, 'pending' => 0, 'recent' => 0, 'trend' => ['percentage' => 0, 'direction' => 'stable']],
                    'wntd' => ['total' => 0, 'unique_versions' => 0, 'recent' => 0, 'trend' => ['percentage' => 0, 'direction' => 'stable']],
                    'users' => ['total' => 0, 'active' => 0, 'by_role' => []]
                ],
                'implementationStatusDistribution' => [],
                'recentActivities' => [],
                'recentImplementations' => [],
                'monthlyTrend' => []
            ]);
        }
    }

    // Calculate trend percentage change compared to previous period
    private function calculateTrend($table)
    {
        try {
            // Table names might need quoting differently in different DB systems
            $driver = DB::connection()->getDriverName();
            $tableName = $table;
            
            // For PostgreSQL, we need to ensure the table name is properly quoted
            if ($driver === 'pgsql') {
                $tableName = '"' . $table . '"';
            }
            
            $currentPeriod = DB::table(DB::raw($tableName))
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->count();
                
            $previousPeriod = DB::table(DB::raw($tableName))
                ->where('created_at', '>=', Carbon::now()->subDays(14))
                ->where('created_at', '<', Carbon::now()->subDays(7))
                ->count();
                
            if ($previousPeriod == 0) {
                return ['percentage' => 0, 'direction' => 'stable'];
            }
            
            $percentageChange = (($currentPeriod - $previousPeriod) / $previousPeriod) * 100;
            $direction = $percentageChange > 0 ? 'up' : ($percentageChange < 0 ? 'down' : 'stable');
            
            return [
                'percentage' => round(abs($percentageChange)),
                'direction' => $direction
            ];
        } catch (\Exception $e) {
            Log::error("Error calculating trend for {$table}: " . $e->getMessage());
            return ['percentage' => 0, 'direction' => 'stable'];
        }
    }
    
    // Get user count by role
    private function getUserCountByRole()
    {
        try {
            $driver = DB::connection()->getDriverName();
            
            // Different SQL for different databases
            if ($driver === 'pgsql') {
                $roles = DB::table('roles')
                    ->join('model_has_roles', 'roles.id', '=', 'model_has_roles.role_id')
                    ->select('roles.name', DB::raw('count(*) as count'))
                    ->groupBy('roles.name')
                    ->get();
            } else {
                // MySQL version
                $roles = DB::table('roles')
                    ->join('model_has_roles', 'roles.id', '=', 'model_has_roles.role_id')
                    ->select('roles.name', DB::raw('count(*) as count'))
                    ->groupBy('roles.name')
                    ->get();
            }
            
            return $roles->map(function($role) {
                return [
                    'role' => $role->name,
                    'count' => $role->count,
                    'color' => $this->getColorByRole($role->name)
                ];
            });
        } catch (\Exception $e) {
            Log::error('Error getting user count by role: ' . $e->getMessage());
            return collect([]);
        }
    }
    
    // Get recent activities across the system
    private function getRecentActivities()
    {
        try {
            $activities = collect();
            
            // Add recent implementations
            $implementations = $this->safeMethod(function() {
                return Implementation::orderBy('created_at', 'desc')
                    ->limit(3)
                    ->get()
                    ->map(function($item) {
                        return [
                            'id' => 'imp-' . $item->id,
                            'type' => 'implementation',
                            'title' => $item->site_name . ' implementation ' . $item->status,
                            'description' => $item->cell_name ? 'Cell: ' . $item->cell_name : 'Implementation update',
                            'status' => $item->status,
                            'time' => $item->created_at->diffForHumans(),
                            'user' => $item->implementor ?? 'System'
                        ];
                    });
            }, collect([]));
            $activities = $activities->concat($implementations);
            
            // Add recent WNTD updates
            $wntdUpdates = $this->safeMethod(function() {
                return WNTD::orderBy('updated_at', 'desc')
                    ->limit(3)
                    ->get()
                    ->map(function($item) {
                        return [
                            'id' => 'wntd-' . $item->id,
                            'type' => 'wntd',
                            'title' => $item->site_name . ' updated',
                            'description' => 'WNTD information updated',
                            'status' => $item->status,
                            'time' => $item->updated_at->diffForHumans(),
                            'user' => 'System'
                        ];
                    });
            }, collect([]));
            $activities = $activities->concat($wntdUpdates);
            
            // Add recent user logins
            $userLogins = $this->safeMethod(function() {
                return User::orderBy('updated_at', 'desc')
                    ->limit(2)
                    ->get()
                    ->map(function($item) {
                        return [
                            'id' => 'user-' . $item->id,
                            'type' => 'user',
                            'title' => $item->name . ' active',
                            'description' => 'User activity',
                            'status' => 'active',
                            'time' => $item->updated_at->diffForHumans(),
                            'user' => $item->name
                        ];
                    });
            }, collect([]));
            $activities = $activities->concat($userLogins);
            
            // Add safeguard for the sorting method
            return $this->safeMethod(function() use ($activities) {
                return $activities->sortByDesc(function ($item) {
                    return Carbon::parse($item['time']);
                })->values()->take(5);
            }, collect([]));
        } catch (\Exception $e) {
            Log::error('Error generating recent activities: ' . $e->getMessage());
            return collect([]);
        }
    }
    
    /**
     * Create a database-agnostic date part extraction query
     * 
     * @param string $part The date part to extract ('month', 'year', 'day', etc.)
     * @param string $column The column to extract from
     * @param string|null $alias Optional alias for the result
     * @return \Illuminate\Database\Query\Expression
     */
    private function getDatePartExpression(string $part, string $column, ?string $alias = null)
    {
        $driver = DB::connection()->getDriverName();
        
        $aliasClause = $alias ? " as {$alias}" : "";
        
        if ($driver === 'pgsql') {
            // PostgreSQL syntax
            return DB::raw("EXTRACT({$part} FROM {$column}){$aliasClause}");
        } else {
            // MySQL syntax (default)
            $function = strtoupper($part);
            return DB::raw("{$function}({$column}){$aliasClause}");
        }
    }

    /**
     * Get monthly implementation trend data
     * 
     * @return \Illuminate\Support\Collection
     */
    private function getMonthlyImplementationTrend()
    {
        try {
            $months = collect();
            
            // Generate last 6 months
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $months->push([
                    'month' => $date->format('M'),
                    'completed' => 0,
                    'in_progress' => 0
                ]);
            }
            
            // Populate with actual data using database-agnostic date part extraction
            $monthExpr = $this->getDatePartExpression('month', 'created_at', 'month');
            $yearExpr = $this->getDatePartExpression('year', 'created_at', 'year');
            
            $implementationData = Implementation::select(
                $monthExpr,
                $yearExpr,
                'status',
                DB::raw('COUNT(*) as count')
            )
            ->whereIn('status', ["completed", "in_progress"])
            ->where('created_at', '>=', Carbon::now()->subMonths(6));
            
            // Apply different GROUP BY clause based on the database driver
            $driver = DB::connection()->getDriverName();
            if ($driver === 'pgsql') {
                $implementationData = $implementationData
                    ->groupBy(
                        DB::raw('EXTRACT(YEAR FROM created_at)'),
                        DB::raw('EXTRACT(MONTH FROM created_at)'),
                        'status'
                    )
                    ->get();
            } else {
                // For MySQL, we can use the aliases in GROUP BY
                $implementationData = $implementationData
                    ->groupBy('year', 'month', 'status')
                    ->get();
            }
                
            foreach ($implementationData as $data) {
                // Ensure data->month and data->year are cast to integers
                // Some database drivers might return numeric strings
                if (isset($data->month) && isset($data->year)) {
                    $month = (int)$data->month;
                    $year = (int)$data->year;
                    
                    try {
                        $date = Carbon::createFromDate($year, $month, 1);
                        $monthKey = $date->format('M');
                        
                        // Find the month in our collection
                        $monthIndex = $months->search(function($item) use ($monthKey) {
                            return $item['month'] === $monthKey;
                        });
                        
                        if ($monthIndex !== false && isset($data->status)) {
                            $months[$monthIndex][$data->status] = (int)$data->count;
                        }
                    } catch (\Exception $e) {
                        Log::error('Error processing date in implementation trend', [
                            'error' => $e->getMessage(),
                            'year' => $year,
                            'month' => $month
                        ]);
                    }
                }
            }
            
            return $months;
        } catch (\Exception $e) {
            // Log the error
            Log::error('Error generating monthly implementation trend: ' . $e->getMessage());
            
            // Return empty data set with last 6 months
            $emptyMonths = collect();
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $emptyMonths->push([
                    'month' => $date->format('M'),
                    'completed' => 0,
                    'in_progress' => 0
                ]);
            }
            return $emptyMonths;
        }
    }
    
    // Get color for a role
    private function getColorByRole($role)
    {
        $roleColors = [
            'super-admin' => '#EF4444', // red
            'admin' => '#3B82F6', // blue
            'editor' => '#10B981', // green
            'user' => '#6B7280'  // gray
        ];
        
        return $roleColors[$role] ?? '#6B7280';
    }
    
    // Generate a consistent color based on string
    private function getRandomColor($string)
    {
        // Pre-defined palette of colors
        $colors = [
            '#3B82F6', // blue
            '#10B981', // green
            '#F59E0B', // amber
            '#8B5CF6', // purple
            '#EC4899', // pink
            '#06B6D4', // cyan
            '#F97316', // orange
            '#14B8A6', // teal
        ];
        
        // Use a hash of the string to pick a consistent color
        $hash = crc32($string ?? '');
        $index = abs($hash) % count($colors);
        
        return $colors[$index];
    }

    /**
     * Render the tools manager page
     * 
     * @return \Inertia\Response
     */
    public function toolsManager()
    {
        try {
            return Inertia::render('ToolsManager/Index');
        } catch (\Exception $e) {
            Log::error('Error rendering tools manager page: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            // Return a simple error page if the main page fails to render
            return Inertia::render('Error', [
                'message' => 'There was an error loading the tools manager. Please try again later.'
            ]);
        }
    }

    /**
     * Get the progress of a batch job
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function get_progress(Request $request)
    {
        try {
            $batchId = $request->batchId;
            if (!$batchId) {
                return response()->json(['error' => 'No batch ID provided'], 400);
            }
            
            if (JobBatch::where('id', $batchId)->exists()) {
                $response = JobBatch::where('id', $batchId)->first();
                if ($response->pending_jobs == 0 || $response->failed_jobs > 0) {
                    session()->put('batch_field_id', '');
                    session()->put('batch_site_id', '');
                }
                return response()->json($response);
            }
            
            return response()->json(['error' => 'Batch not found'], 404);
        } catch (\Exception $e) {
            Log::error('Error getting job progress: ' . $e->getMessage(), [
                'batch_id' => $request->batchId ?? 'none',
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json(['error' => 'Failed to retrieve job progress'], 500);
        }
    }

    /**
     * Safely execute a count on a model with optional where conditions
     *
     * @param string $modelClass The model class name
     * @param array $conditions Optional where conditions
     * @return int Count result or 0 on error
     */
    private function safeCount($modelClass, $conditions = [])
    {
        try {
            $query = $modelClass::query();
            
            foreach ($conditions as $key => $value) {
                if (is_array($value)) {
                    $query->where(...$value);
                } else {
                    $query->where($key, $value);
                }
            }
            
            return $query->count();
        } catch (\Exception $e) {
            Log::error("Error in safeCount for {$modelClass}: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Safely execute a method with a fallback value on error
     *
     * @param callable $callback The function to execute
     * @param mixed $default Default value to return on error
     * @return mixed
     */
    private function safeMethod($callback, $default)
    {
        try {
            return $callback();
        } catch (\Exception $e) {
            Log::error("Error in safeMethod: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return $default;
        }
    }
}
