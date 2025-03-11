<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::withCount('users')->get();
        $usersWithoutRolesCount = User::doesntHave('roles')->count();
        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'noRoles' => $usersWithoutRolesCount,
            'success' => Session::get('success')
        ]);
    }

    public function users()
    {
        $users = User::with('roles')->get();
        $roles = Role::all();
        
        return Inertia::render('Roles/Users', [
            'users' => $users,
            'availableRoles' => $roles,
            'success' => Session::get('success')
        ]);
    }

    public function createUser()
    {
        $roles = Role::all();
        return Inertia::render('Roles/CreateUser', [
            'roles' => $roles
        ]);
    }

    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'roles' => 'array' // Made roles optional
        ]);

        // If no roles are provided, use 'user' as the default role
        if (empty($request->roles)) {
            $userRole = Role::firstOrCreate(['name' => 'user']);
            $roles = [$userRole->id];
        } else {
            $roles = $request->roles;
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => empty($roles) ? 'user' : Role::find($roles[0])->name // Store primary role in the role column
        ]);
        
        // Assign all selected roles
        $user->roles()->sync($roles);

        return redirect()->route('roles.users.view')->with('success', 'User created successfully');
    }

    public function editUser(User $user)
    {
        $roles = Role::all();
        $user->load('roles');
        return Inertia::render('Roles/EditUser', [
            'user' => $user,
            'roles' => $roles
        ]);
    }

    public function updateUser(Request $request, User $user)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'roles' => 'required|array'
        ];

        // Only validate password if it's being changed
        if ($request->filled('password')) {
            $rules['password'] = 'string|min:8|confirmed';
        }

        $request->validate($rules);

        // Update basic user information
        $userData = $request->only('name', 'email');
        
        // Update password if provided
        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }
        
        // Update primary role in the role column
        if (!empty($request->roles)) {
            $userData['role'] = $request->roles[0];
        }
        
        $user->update($userData);
        
        // Sync all selected roles
        $user->roles()->sync($request->roles);
        
        return redirect()->route('roles.users.view')->with('success', 'User updated successfully');
    }

    public function destroyUser(User $user)
    {
        // Don't allow deleting the last super-admin
        if ($user->hasRole('super-admin') && User::role('super-admin')->count() <= 1) {
            return redirect()->route('roles.users.view')->with('error', 'Cannot delete the last super-admin');
        }
        
        $user->delete();
        return redirect()->route('roles.users.view')->with('success', 'User deleted successfully');
    }

    public function search_user(Request $request)
    {
        $search = $request->input('query');
        if (!empty($search)) {
            $users = User::where('email', 'like', "%$search%")
                        ->orWhere('name', 'like', "%$search%")
                        ->get();
            return $users;
        }
        
        return [];
    }

    public function user_add_to_role(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'role_name' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return back()->with('error', 'User not found');
        }
        
        $newRole = Role::where('name', $request->role_name)->first();
        if (!$newRole) {
            return back()->with('error', 'Role not found');
        }
        
        // If replacing current role(s)
        if ($request->input('replace_existing', false)) {
            $user->roles()->detach();
            $user->role = $request->role_name; // Update role column
            $user->save();
        }
        
        $user->assignRole($newRole);
        
        // If this is the user's first role, set it as the primary role in the role column
        if (!$user->role) {
            $user->role = $request->role_name;
            $user->save();
        }
        
        return to_route('roles.index')->with('success', 'User role updated successfully');
    }

    public function createRole(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'nullable|array'
        ]);
        
        $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);
        
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }
        
        return back()->with('success', 'Role created successfully');
    }
    
    public function deleteRole(Role $role)
    {
        // Don't allow deleting super-admin role
        if ($role->name === 'super-admin') {
            return back()->with('error', 'Cannot delete the super-admin role');
        }
        
        // Reassign users to 'user' role (or create it if it doesn't exist)
        $defaultRole = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        foreach ($role->users as $user) {
            $user->removeRole($role);
            $user->assignRole($defaultRole);
            $user->role = 'user';
            $user->save();
        }
        
        $role->delete();
        return back()->with('success', 'Role deleted successfully');
    }

    public function access()
    {
        // Get all routes
        $routes = collect(Route::getRoutes())->filter(function ($route) {
            // Check if the route is defined in web.php and starts with /dashboard or /profile or other important sections
            return strpos($route->getActionName(), 'App\\Http\\Controllers') === 0
                && !in_array('api', $route->middleware())
                && (strpos($route->uri(), 'dashboard') === 0 || 
                    strpos($route->uri(), 'profile') === 0 || 
                    strpos($route->uri(), 'import') === 0 || 
                    strpos($route->uri(), 'roles') === 0 ||
                    strpos($route->uri(), 'settings') === 0 ||
                    strpos($route->uri(), 'admin') === 0);
        });
    
        // Initialize routeRoles array to store the roles for each route
        $routeRoles = [];
    
        // Loop through filtered routes and determine roles from middleware
        foreach ($routes as $route) {
            $middleware = $route->middleware();
            $roles = [];
    
            // Extract roles from middleware if available (for 'role:' middleware)
            foreach ($middleware as $mw) {
                if (preg_match('/role:([a-zA-Z0-9\-|,]+)/', $mw, $matches)) {
                    $roles = array_merge($roles, explode('|', $matches[1])); // handle multiple roles
                }
            }
    
            // Create a unique key for each route using URI and method
            $routeKey = strtolower($route->uri() . '|' . $route->methods()[0]);
    
            // Assign roles to the route
            $routeRoles[$routeKey] = [
                'controller' => class_basename($route->getController()),
                'action' => $route->getActionMethod(),
                'roles' => array_unique($roles),
                'method' => strtolower($route->methods()[0]),
                'name' => $route->getName()
            ];
        }
    
        // Get all roles from the database
        $roles = Role::all();
    
        // Pass the filtered routes and associated roles to the view
        return Inertia::render('Roles/Access', [
            'routes' => $routes->values()->toArray(),  // Convert collection back to array
            'roles' => $roles,
            'routeRoles' => $routeRoles,  // Include the roles for each route
            'success' => Session::get('success')
        ]);
    }

    public function updateAccess(Request $request)
    {
        $routeRoles = $request->input('routeRoles', []);
        
        // Create a backup of the routes file
        $routesFilePath = base_path('routes/web.php');
        $routesBackupPath = base_path('routes/web.php.backup-' . time());
        copy($routesFilePath, $routesBackupPath);
        
        // Get the routes content
        $routesContent = file_get_contents($routesFilePath);

        // Extract content before and after the dynamic routes section
        $beforeDynamicRoutes = preg_replace('/(.*)(\/\/ Start Dynamic Routes.*)/s', '$1', $routesContent);
        $afterDynamicRoutes = preg_replace('/(.*\/\/ End Dynamic Routes)(.*)/s', '$2', $routesContent);

        // Group routes by controller and middleware
        $groupedRoutes = [];
        foreach ($routeRoles as $routeKey => $routeData) {
            if (isset($routeData['controller'], $routeData['action'], $routeData['roles'], $routeData['method'], $routeData['name'])) {
                $controller = $routeData['controller'];
                $uri = explode('|', $routeKey)[0];  // Extract URI from routeKey
                $roles = implode('|', $routeData['roles']);  // Merge roles correctly
                $middleware = !empty($roles) ? "['auth', 'role:$roles']" : "['auth']";
                $groupedRoutes[$controller][] = $routeData + ['uri' => $uri, 'middleware' => $middleware];
            }
        }

        // Generate new dynamic routes
        $dynamicRoutes = "// Start Dynamic Routes\n";
        foreach ($groupedRoutes as $controller => $routes) {
            $dynamicRoutes .= "Route::controller({$controller}::class)->middleware('auth')->group(function () {\n";
            foreach ($routes as $routeData) {
                $action = $routeData['action'];
                $method = $routeData['method'];
                $name = $routeData['name'];
                $uri = $routeData['uri'];
                $middleware = $routeData['middleware'];

                if ($middleware !== "['auth']") {
                    $dynamicRoutes .= "    Route::$method('$uri', '$action')->middleware($middleware)->name('$name');\n";
                } else {
                    $dynamicRoutes .= "    Route::$method('$uri', '$action')->name('$name');\n";
                }
            }
            $dynamicRoutes .= "});\n";
        }
        $dynamicRoutes .= "// End Dynamic Routes\n";

        // Combine the content
        $newRoutesContent = trim($beforeDynamicRoutes) . "\n" . trim($dynamicRoutes) . "\n" . trim($afterDynamicRoutes);
        
        // Write to the routes temp file first for safety
        $routesTempPath = base_path('routes/web.php.temp');
        file_put_contents($routesTempPath, $newRoutesContent);
        
        // If successful, update the actual routes file
        if (file_exists($routesTempPath)) {
            file_put_contents($routesFilePath, $newRoutesContent);
        }

        return redirect()->route('roles.access')->with('success', 'Access permissions updated successfully.');
    }
}