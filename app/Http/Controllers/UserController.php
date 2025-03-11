<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index()
    {
        // Check if the user has permission to view users
        if (!Auth::user()->hasRole(['super-admin', 'admin'])) {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access');
        }

        // Get all users with their roles
        $users = User::with('roles')->get();
        
        return Inertia::render('Users/Index', [
            'users' => $users,
            'success' => session('success'),
            'error' => session('error')
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        // Check if the user has permission to create users
        if (!Auth::user()->hasRole(['super-admin', 'admin'])) {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access');
        }

        $roles = Role::all();
        
        return Inertia::render('Users/Create', [
            'roles' => $roles
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        // Check if the user has permission to create users
        if (!Auth::user()->hasRole(['super-admin', 'admin'])) {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'roles' => 'required|array|min:1'
        ]);

        // Create the user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->roles[0] // Set the primary role
        ]);

        // Assign roles to the user
        $user->syncRoles($request->roles);

        return redirect()->route('users.index')->with('success', 'User created successfully');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        // Check if the user has permission to edit users
        if (!Auth::user()->hasRole(['super-admin', 'admin'])) {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access');
        }

        // Don't allow non-super-admins to edit super-admins
        if ($user->hasRole('super-admin') && !Auth::user()->hasRole('super-admin')) {
            return redirect()->route('users.index')->with('error', 'You cannot edit a super-admin user');
        }

        $roles = Role::all();
        $user->load('roles');
        
        return Inertia::render('Users/Edit', [
            'user' => $user,
            'userRoles' => $user->roles->pluck('id')->toArray(),
            'roles' => $roles
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        // Check if the user has permission to update users
        if (!Auth::user()->hasRole(['super-admin', 'admin'])) {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access');
        }

        // Don't allow non-super-admins to update super-admins
        if ($user->hasRole('super-admin') && !Auth::user()->hasRole('super-admin')) {
            return redirect()->route('users.index')->with('error', 'You cannot update a super-admin user');
        }

        // Prevent removing super-admin role from the last super-admin user
        if ($user->hasRole('super-admin') && 
            (!in_array('super-admin', $request->roles)) && 
            User::role('super-admin')->count() <= 1) {
            return redirect()->route('users.index')
                ->with('error', 'Cannot remove super-admin role from the last super-admin user');
        }

        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,'.$user->id,
            'roles' => 'required|array|min:1'
        ];

        // Only validate password if it's provided
        if ($request->filled('password')) {
            $rules['password'] = ['required', 'confirmed', Rules\Password::defaults()];
        }

        $validated = $request->validate($rules);

        // Update user information
        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $request->roles[0] // Set the primary role
        ];

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user->update($userData);

        // Sync roles
        $user->syncRoles($request->roles);

        return redirect()->route('users.index')->with('success', 'User updated successfully');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        // Check if the user has permission to delete users
        if (!Auth::user()->hasRole(['super-admin'])) {
            return redirect()->route('users.index')->with('error', 'Unauthorized access');
        }

        // Don't allow deleting yourself
        if (Auth::id() === $user->id) {
            return redirect()->route('users.index')->with('error', 'You cannot delete your own account');
        }

        // Don't allow deleting the last super-admin
        if ($user->hasRole('super-admin') && User::role('super-admin')->count() <= 1) {
            return redirect()->route('users.index')
                ->with('error', 'Cannot delete the last super-admin user');
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'User deleted successfully');
    }

    /**
     * Update the authenticated user's profile.
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,'.$user->id,
        ]);

        // Update basic profile information
        $user->update($request->only('name', 'email'));

        return redirect()->route('profile.edit')->with('success', 'Profile updated successfully');
    }

    /**
     * Update the authenticated user's password.
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->route('profile.edit')->with('success', 'Password updated successfully');
    }
} 