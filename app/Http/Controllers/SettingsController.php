<?php

namespace App\Http\Controllers;

use App\Models\ImportDB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache; // Add this line
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $db = ImportDB::get();
        
        // If there's at least one database connection, redirect to the SQL Explorer page
        if ($db->count() > 0) {
            return redirect()->route('sql.import', $db->first()->id);
        }
        
        return Inertia::render('Settings/Index', [
            'db' => $db
        ]);
    }

    public function import_db_save(Request $request)
    {
        
        $request->validate([
            'id' => 'nullable', 
            'dbtype'=>'required',
            'host' => 'required',
            'port' => 'required',
            'database' => 'required',
            'username' => 'required',
            'password' => 'required',
            'sslrequired'=>'nullable',
            'catalog'=>'nullable',
        ]);
     
        if ($request->has('id')) {
         
            $db = ImportDB::find($request->id);
            if ($db) {
                // Construct cache keys
                $cacheKeyTables = 'db_tables_' . $db->host . ':' . $db->port . '_' . $db->catalog . '_' . $db->username;
                $cacheKeyColumns = 'db_columns_' . $db->host . ':' . $db->port . '_' . $db->catalog . '_' . $db->username;

                // Delete the cache keys
                Cache::forget($cacheKeyTables);
                Cache::forget($cacheKeyColumns);
                $db->update($request->except('id')); // Update the record with all fields except 'id'
            }
            return response()->json([
                'success' => ['message' => 'Saved successfully.'],
            ], 200);
        } else {
      
       
            ImportDB::create($request->all());
            return to_route('settings.index');
        }


    }
    public function import_db_delete($id)
    {
        $db = ImportDB::find($id);
        if ($db && $db->dbtype === 'starburst') {
            // Construct cache keys
            $cacheKeyTables = 'db_tables_' . $db->host . ':' . $db->port . '_' . $db->catalog . '_' . $db->username;
            $cacheKeyColumns = 'db_columns_' . $db->host . ':' . $db->port . '_' . $db->catalog . '_' . $db->username;

            // Delete the cache keys
            Cache::forget($cacheKeyTables);
            Cache::forget($cacheKeyColumns);

            // Delete the database record
            $db->delete();
        }
         // Delete the database record only if dbtype is diff than starburst
        if ($db) {
            $db->delete();
        }
        return back();
    }
    
}
