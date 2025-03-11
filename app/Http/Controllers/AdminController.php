<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;
use App\Models\User;
use App\Models\Site;
use App\Models\Implementation;
use App\Models\ImplementationTracking;
use App\Models\WNTD;
use App\Models\RANParameter;
use App\Models\RANStructParameter;
use App\Models\Value;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct()
    {
        $this->middleware(\App\Http\Middleware\AdminMiddleware::class);
    }

    /**
     * Show the admin dashboard.
     */
    public function index()
    {
        try {
            // Get detailed summary statistics for dashboard
            $stats = [
                'users' => [
                    'total' => User::count(),
                    'active' => User::where('last_login_at', '>=', now()->subDays(30))->count(),
                    'byRole' => [
                        'superAdmin' => User::role('super-admin')->count(),
                        'admin' => User::role('admin')->count(),
                        'editor' => User::role('editor')->count(),
                        'user' => User::role('user')->count(),
                    ],
                    'recentlyAdded' => User::where('created_at', '>=', now()->subDays(7))->count(),
                ],
                'wntd' => [
                    'total' => WNTD::count(),
                    'active' => WNTD::where('status', 'active')->count(),
                    'byStatus' => [
                        'active' => WNTD::where('status', 'active')->count(),
                        'planning' => WNTD::where('status', 'planning')->count(),
                        'maintenance' => WNTD::where('status', 'maintenance')->count(),
                        'decommissioned' => WNTD::where('status', 'decommissioned')->count(),
                    ],
                    'recentlyAdded' => WNTD::where('created_at', '>=', now()->subDays(7))->count(),
                ],
                'implementations' => [
                    'total' => Implementation::count(),
                    'active' => Implementation::where('status', 'active')->count(),
                    'recentlyAdded' => Implementation::where('created_at', '>=', now()->subDays(7))->count(),
                ],
                'ranParameters' => [
                    'total' => RANParameter::count(),
                    'recentlyAdded' => RANParameter::where('created_at', '>=', now()->subDays(7))->count(),
                ],
                'systemHealth' => [
                    'diskUsage' => disk_free_space('/') / disk_total_space('/') * 100,
                    'memoryUsage' => memory_get_usage(true) / 1024 / 1024,
                    'phpVersion' => PHP_VERSION,
                    'laravelVersion' => app()->version(),
                ],
            ];

            return Inertia::render('Admin/Index', [
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error in admin index: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return Inertia::render('Admin/Index', [
                'stats' => [],
                'error' => 'An error occurred while loading dashboard data.'
            ]);
        }
    }

    /**
     * Show the analytics page with detailed statistics.
     */
    public function analytics()
    {
        $statistics = [
            'wntd' => [
                'total' => WNTD::count(),
                'active' => WNTD::where('status', 'Active')->count(),
                'planning' => WNTD::where('status', 'Planning')->count(),
                'maintenance' => WNTD::where('status', 'Maintenance')->count(),
                'decommissioned' => WNTD::where('status', 'Decommissioned')->count(),
                'recentlyAdded' => WNTD::orderBy('created_at', 'desc')->limit(5)->count(),
            ],
            'users' => [
                'total' => User::count(),
                'active' => User::where('status', 'active')->count(),
                'inactive' => User::where('status', 'inactive')->count(),
                'recentlyAdded' => User::orderBy('created_at', 'desc')->limit(5)->count(),
            ],
        ];

        return response()->json($statistics);
    }

    /**
     * Show the settings page.
     */
    public function settings()
    {
        try {
            // Get all settings
            $settings = Setting::all()->pluck('value', 'key')->toArray();
            
            return Inertia::render('Admin/Settings', [
                'settings' => $settings
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading settings: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return Inertia::render('Admin/Settings', [
                'settings' => [],
                'error' => 'An error occurred while loading settings.'
            ]);
        }
    }

    /**
     * Update system settings.
     */
    public function updateSettings(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'siteName' => 'required|string|max:255',
                'siteDescription' => 'nullable|string',
                'maintenanceMode' => 'boolean',
                'allowRegistration' => 'boolean',
                'emailNotifications' => 'boolean',
                'backupFrequency' => 'required|in:daily,weekly,monthly',
                'maxFileSize' => 'required|numeric|min:1',
                'defaultUserRole' => 'required|in:user,editor',
                'sessionTimeout' => 'required|numeric|min:1',
                'smtpHost' => 'required_if:emailNotifications,true|string',
                'smtpPort' => 'required_if:emailNotifications,true|numeric',
                'smtpUser' => 'required_if:emailNotifications,true|string',
                'smtpPassword' => 'required_if:emailNotifications,true|string',
                'smtpEncryption' => 'required_if:emailNotifications,true|in:tls,ssl,none',
            ]);

            if ($validator->fails()) {
                return back()->withErrors($validator)->withInput();
            }

            // Update settings in database
            foreach ($request->all() as $key => $value) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]
                );
            }

            // Update environment variables for email settings if email notifications are enabled
            if ($request->emailNotifications) {
                $this->updateMailEnvironmentVariables($request);
            }

            return back()->with('success', 'Settings updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating settings: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return back()->with('error', 'An error occurred while updating settings.');
        }
    }

    /**
     * Create a new backup.
     */
    public function createBackup()
    {
        try {
            // Create backup filename with timestamp
            $filename = 'backup_' . now()->format('Y-m-d_H-i-s') . '.sql';
            
            // Get database configuration
            $host = config('database.connections.mysql.host');
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            
            // Create backup command
            $command = "mysqldump -h {$host} -u {$username} -p{$password} {$database} > storage/app/backups/{$filename}";
            
            // Execute backup command
            exec($command);
            
            // Update last backup time in settings
            Setting::updateOrCreate(
                ['key' => 'lastBackupTime'],
                ['value' => now()->toDateTimeString()]
            );
            
            return back()->with('success', 'Backup created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating backup: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return back()->with('error', 'An error occurred while creating backup.');
        }
    }

    /**
     * Update mail environment variables.
     */
    private function updateMailEnvironmentVariables($request)
    {
        $path = base_path('.env');

        if (file_exists($path)) {
            file_put_contents($path, str_replace(
                [
                    'MAIL_HOST=' . env('MAIL_HOST'),
                    'MAIL_PORT=' . env('MAIL_PORT'),
                    'MAIL_USERNAME=' . env('MAIL_USERNAME'),
                    'MAIL_PASSWORD=' . env('MAIL_PASSWORD'),
                    'MAIL_ENCRYPTION=' . env('MAIL_ENCRYPTION'),
                ],
                [
                    'MAIL_HOST=' . $request->smtpHost,
                    'MAIL_PORT=' . $request->smtpPort,
                    'MAIL_USERNAME=' . $request->smtpUser,
                    'MAIL_PASSWORD=' . $request->smtpPassword,
                    'MAIL_ENCRYPTION=' . $request->smtpEncryption,
                ],
                file_get_contents($path)
            ));
        }
    }

    /**
     * Show the users management page.
     */
    public function users()
    {
        try {
            $users = User::with('roles')->get();
            $roles = Role::all();
            
            return Inertia::render('Admin/Users', [
                'users' => $users,
                'availableRoles' => $roles
            ]);
        } catch (\Exception $e) {
            Log::error('Error in admin users: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return Inertia::render('Admin/Users', [
                'users' => [],
                'availableRoles' => [],
                'error' => 'An error occurred while loading user data.'
            ]);
        }
    }

    /**
     * Update an existing user.
     */
    public function updateUser(Request $request, User $user)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $user->id,
                'role' => 'required|string|exists:roles,name',
            ]);

            DB::beginTransaction();
            
            $user->name = $validated['name'];
            $user->email = $validated['email'];
            $user->save();
            
            // Update role
            $user->syncRoles([$validated['role']]);
            
            DB::commit();

            return redirect()->back()->with('success', 'User updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error updating user: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'user_id' => $user->id
            ]);
            
            return redirect()->back()->with('error', 'Failed to update user: ' . $e->getMessage());
        }
    }

    /**
     * Delete a user.
     */
    public function deleteUser(User $user)
    {
        try {
            // Prevent deleting the last super-admin
            $superAdminCount = User::role('super-admin')->count();
            if ($user->hasRole('super-admin') && $superAdminCount <= 1) {
                return redirect()->back()->with('error', 'Cannot delete the last super admin user.');
            }
            
            $user->delete();
            return redirect()->back()->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting user: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'user_id' => $user->id
            ]);
            
            return redirect()->back()->with('error', 'Failed to delete user: ' . $e->getMessage());
        }
    }

    /**
     * Create a new user.
     */
    public function storeUser(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'role' => 'required|string|exists:roles,name',
                'password' => 'required|min:8|confirmed',
            ]);

            DB::beginTransaction();
            
            $user = new User();
            $user->name = $validated['name'];
            $user->email = $validated['email'];
            $user->password = Hash::make($validated['password']);
            $user->save();
            
            // Assign the role to the user
            $user->assignRole($validated['role']);
            
            DB::commit();

            return redirect()->back()->with('success', 'User created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error creating user: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return redirect()->back()->with('error', 'Failed to create user: ' . $e->getMessage());
        }
    }

    /**
     * Get user statistics.
     *
     * @return array
     */
    private function getUserStats()
    {
        return [
            'total' => User::count(),
            'byRole' => [
                'superAdmin' => User::role('super-admin')->count(),
                'admin' => User::role('admin')->count(),
                'editor' => User::role('editor')->count(),
                'user' => User::role('user')->count(),
            ],
            'active' => User::where('last_login_at', '>=', now()->subDays(7))->count(),
        ];
    }

    /**
     * Get site statistics.
     *
     * @return array
     */
    private function getSiteStats()
    {
        return [
            'total' => Site::count(),
            'byStatus' => [
                'active' => Site::where('status', 'Active')->count(),
                'planning' => Site::where('status', 'Planning')->count(),
                'maintenance' => Site::where('status', 'Maintenance')->count(),
                'decommissioned' => Site::where('status', 'Decommissioned')->count(),
            ],
            'recentlyAdded' => Site::orderBy('created_at', 'desc')->limit(5)->count(),
        ];
    }

    /**
     * Get activity statistics.
     *
     * @return array
     */
    private function getActivityStats()
    {
        return [
            'logins' => 0, // Placeholder for actual login stats
            'dataEntries' => DB::table('sites')->count() + 
                            DB::table('implementations')->count() + 
                            DB::table('locations')->count(),
            'dataExports' => 0, // Placeholder for actual export stats
            'dataImports' => 0, // Placeholder for actual import stats
        ];
    }

    /**
     * Calculate system uptime.
     *
     * @return string
     */
    private function calculateSystemUptime()
    {
        // For Windows using PowerShell
        try {
            $uptime = shell_exec('powershell -command "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object LastBootUpTime | ForEach-Object { (Get-Date) - $_.LastBootUpTime } | ForEach-Object { \"{0} days, {1} hours, {2} minutes\" -f $_.Days, $_.Hours, $_.Minutes }"');
            return $uptime ? trim($uptime) : 'Unknown';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Get application version.
     *
     * @return string
     */
    private function getSystemVersion()
    {
        try {
            if (file_exists(base_path('version.txt'))) {
                return file_get_contents(base_path('version.txt'));
            }
            return '1.0.0';
        } catch (\Exception $e) {
            return '1.0.0';
        }
    }

    /**
     * Get last backup time.
     *
     * @return string
     */
    private function getLastBackupTime()
    {
        // Placeholder - would normally check actual backup files
        return 'No backups found';
    }
} 