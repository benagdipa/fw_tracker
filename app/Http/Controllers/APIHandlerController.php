<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\WNTD;
use App\Models\Implementation;
use App\Models\ImplementationTracking;
use Illuminate\Support\Facades\Validator;
use App\Models\RANParameter;
use App\Models\RANStructParameter;
use App\Models\Setting;
use App\Models\Value;

class APIHandlerController extends Controller
{
    /**
     * Update WNTD record
     */
    public function updateWNTD(Request $request)
    {
        try {
            DB::beginTransaction();
            
            // Validate the incoming data
            $validator = Validator::make($request->all(), [
                'id' => 'required|exists:wntd,id',
                'site_name' => 'required|string|max:255',
                'loc_id' => 'nullable|string|max:50',
                'wntd' => 'nullable|string|max:50',
                'imsi' => 'nullable|string|max:50',
                'version' => 'nullable|string|max:50',
                'avc' => 'nullable|string|max:50',
                'bw_profile' => 'nullable|string|max:255',
                'home_cell' => 'nullable|string|max:50',
                'home_pci' => 'nullable|string|max:50',
                'traffic_profile' => 'nullable|string|max:50',
                'lon' => 'nullable|numeric',
                'lat' => 'nullable|numeric',
                'solution_type' => 'nullable|string|max:50',
                'status' => 'nullable|string|max:50',
                'remarks' => 'nullable|string',
                'artifacts' => 'nullable|string'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Get the WNTD record with pessimistic locking
            $wntd = WNTD::lockForUpdate()->findOrFail($request->id);
            
            // Record original values for history
            $originalValues = $wntd->getAttributes();
            
            // Track which fields were updated
            $updatedFields = [];
            $userId = auth()->id() ?: 1;
            
            // Update WNTD model with new values
            foreach ($request->all() as $field => $value) {
                // Skip non-fillable fields
                if (!in_array($field, $wntd->getFillable()) || $field === 'id') {
                    continue;
                }
                
                // Only update if changed
                if ($wntd->{$field} != $value) {
                    // Store original value for history
                    $originalValue = $wntd->{$field};
                    
                    // Set new value
                    $wntd->{$field} = $value;
                    
                    // Record this field as changed
                    $updatedFields[$field] = [
                        'old_value' => $originalValue,
                        'new_value' => $value
                    ];
                }
            }
            
            // Only save if something changed
            if (count($updatedFields) > 0) {
                $wntd->save();
                
                // Save history records for each changed field
                foreach ($updatedFields as $field => $changes) {
                    // Handle PostgreSQL JSON format appropriately
                    if (DB::connection()->getDriverName() === 'pgsql') {
                        // Convert values to JSON for PostgreSQL
                        $oldValueJson = is_null($changes['old_value']) ? 
                            null : 
                            json_encode(['value' => $changes['old_value']]);
                            
                        $newValueJson = is_null($changes['new_value']) ? 
                            null : 
                            json_encode(['value' => $changes['new_value']]);
                            
                        DB::table('wntd_history')->insert([
                            'wntd_id' => $wntd->id,
                            'field_name' => $field,
                            'old_value' => $oldValueJson,
                            'new_value' => $newValueJson,
                            'user_id' => $userId,
                            'change_type' => 'update',
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    } else {
                        // For other databases like MySQL
                        DB::table('wntd_history')->insert([
                            'wntd_id' => $wntd->id,
                            'field_name' => $field,
                            'old_value' => is_null($changes['old_value']) ? null : (string)$changes['old_value'],
                            'new_value' => is_null($changes['new_value']) ? null : (string)$changes['new_value'],
                            'user_id' => $userId,
                            'change_type' => 'update',
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'WNTD record updated successfully',
                'data' => $wntd,
                'updated_fields' => $updatedFields
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error updating WNTD record: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update WNTD record',
                'error' => app()->environment('local') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }
    
    /**
     * Update Implementation record
     */
    public function updateImplementation(Request $request)
    {
        try {
            $data = $request->input('data');
            $id = $data['id'];
            
            // Remove id from data for update
            unset($data['id']);
            
            // Determine which fields go to the main table vs. tracking table
            $mainTableFields = ['category', 'siteName', 'eNB_gNB', 'implementor', 
                'comments', 'enm_scripts_path', 'sp_scripts_path', 'CRQ'];
            
            $mainData = [];
            $trackingData = [];
            
            foreach ($data as $key => $value) {
                if (in_array($key, $mainTableFields)) {
                    $mainData[$key] = $value;
                } else {
                    $trackingData[$key] = $value;
                }
            }
            
            // Update main table
            if (!empty($mainData)) {
                DB::table('implementations')->where('id', $id)->update($mainData);
            }
            
            // Update tracking fields
            foreach ($trackingData as $key => $value) {
                // Check if tracking record exists
                $tracking = ImplementationTracking::where('implementation_area_id', $id)
                    ->where('key', $key)
                    ->first();
                
                if ($tracking) {
                    $tracking->value = $value;
                    $tracking->save();
                } else {
                    ImplementationTracking::create([
                        'implementation_area_id' => $id,
                        'key' => $key,
                        'value' => $value
                    ]);
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Implementation record updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating Implementation record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating Implementation record: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Add new WNTD record
     */
    public function addWNTDRow(Request $request)
    {
        try {
            $data = $request->input('data');
            
            // Fields for main table
            $mainTableFields = ['site_name', 'loc_id', 'wntd', 'imsi', 'version', 'avc', 
                'bw_profile', 'lon', 'lat', 'home_cell', 'home_pci', 'traffic_profile'];
            
            $mainData = [];
            
            foreach ($data as $key => $value) {
                if (in_array($key, $mainTableFields)) {
                    $mainData[$key] = $value;
                }
            }
            
            // Insert into main table
            $id = DB::table('wntd')->insertGetId($mainData);
            
            return response()->json([
                'success' => true,
                'message' => 'WNTD record created successfully',
                'id' => $id
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating WNTD record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating WNTD record: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Add new Implementation record
     */
    public function addImplementationRow(Request $request)
    {
        try {
            $data = $request->input('data');
            
            // Fields for main table
            $mainTableFields = ['category', 'siteName', 'eNB_gNB', 'implementor', 
                'comments', 'enm_scripts_path', 'sp_scripts_path', 'CRQ'];
            
            $mainData = [];
            $trackingData = [];
            
            foreach ($data as $key => $value) {
                if (in_array($key, $mainTableFields)) {
                    $mainData[$key] = $value;
                } else if ($key !== 'id') { // Skip the temporary id
                    $trackingData[$key] = $value;
                }
            }
            
            // Insert into main table
            $id = DB::table('implementations')->insertGetId($mainData);
            
            // Insert tracking fields
            foreach ($trackingData as $key => $value) {
                ImplementationTracking::create([
                    'implementation_area_id' => $id,
                    'key' => $key,
                    'value' => $value
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Implementation record created successfully',
                'id' => $id
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating Implementation record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating Implementation record: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete Implementation record
     */
    public function deleteImplementation($id)
    {
        try {
            if (!$id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record ID is required'
                ], 400);
            }
            
            $record = DB::table('implementations')->where('id', $id)->first();
            
            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record not found'
                ], 404);
            }
            
            // Delete the record
            DB::table('implementations')->where('id', $id)->delete();
            
            // Delete related tracking records
            ImplementationTracking::where('implementation_area_id', $id)->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Implementation record deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting Implementation record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting Implementation record: ' . $e->getMessage()
            ], 500);
        }
    }
} 