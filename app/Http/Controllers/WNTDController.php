<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessWNTDFieldImport;
use App\Models\WNTD;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use League\Csv\Reader;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use App\Services\WNTDImportService;

class WNTDController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Get sorting, searching and pagination parameters
            $order = $request->input('order', 'asc');
            $orderBy = $request->input('order_by', 'id');
            $searchQuery = $request->input('search');
            $perPage = $request->input('per_page');
            $statusFilter = $request->input('status');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            // Validate pagination parameter
            if (!$perPage || $perPage === 'all') {
                $perPage = PHP_INT_MAX;
            } else {
                $perPage = intval($perPage) > 0 ? intval($perPage) : 10;
            }
            
            try {
                // Create a database-agnostic query builder using the new WNTD model
                $wntdQuery = WNTD::query();
                
                // Apply search if provided - using the search scope
                if ($searchQuery) {
                    $wntdQuery = $wntdQuery->search($searchQuery);
                }
                
                // Apply status filter if provided
                if ($statusFilter) {
                    $wntdQuery = $wntdQuery->filterByStatus($statusFilter);
                }
                
                // Apply date filtering if provided
                if ($startDate || $endDate) {
                    $wntdQuery = $wntdQuery->filterByDateRange($startDate, $endDate);
                }
                
                // Apply sorting - using proper column quoting for PostgreSQL
                if (DB::connection()->getDriverName() === 'pgsql') {
                    $wntdQuery->orderByRaw("\"{$orderBy}\" {$order}");
                } else {
                    $wntdQuery->orderBy($orderBy, $order);
                }
                
                // Get the paginated results
                $wntdRecords = $wntdQuery->paginate($perPage);
                
                // Calculate additional statistics for the UI
                
                // 1. Count unique WNTD values (PostgreSQL-compatible)
                $uniqueWNTDsQuery = WNTD::whereNotNull('wntd')
                    ->whereRaw('TRIM(wntd) != \'\'');
                
                if (DB::connection()->getDriverName() === 'pgsql') {
                    $uniqueWNTDs = $uniqueWNTDsQuery->distinct('wntd')->count('wntd');
                } else {
                    $uniqueWNTDs = $uniqueWNTDsQuery->distinct()->count('wntd');
                }
                
                // 2. Get distinct bandwidth profiles with counts
                $bwProfilesQuery = DB::table('wntd')
                    ->select('bw_profile', DB::raw('COUNT(*) as count'))
                    ->whereNotNull('bw_profile')
                    ->whereRaw('TRIM(bw_profile) != \'\'')
                    ->groupBy('bw_profile')
                    ->orderBy('count', 'desc');
                
                $bwProfiles = $bwProfilesQuery->get();
                
                // Get status statistics
                $statusStats = DB::table('wntd')
                    ->select('status', DB::raw('COUNT(*) as count'))
                    ->whereNotNull('status')
                    ->whereRaw('TRIM(status) != \'\'')
                    ->groupBy('status')
                    ->orderBy('count', 'desc')
                    ->get();
                
                // Get total WNTD count
                $totalWNTD = WNTD::count();
                
                // Format date filters for display
                $formattedFilters = [
                    'search' => $searchQuery,
                    'status' => $statusFilter,
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ];
                
                // Prepare response data
                $statistics = [
                    'total' => $totalWNTD,
                    'unique' => $uniqueWNTDs,
                    'bandwidth_profiles' => $bwProfiles,
                    'status_distribution' => $statusStats
                ];
                
                return Inertia::render('WNTD/Index', [
                    'sites' => $wntdRecords,
                    'statistics' => $statistics,
                    'get_data' => [
                        'order' => $order,
                        'order_by' => $orderBy,
                        'search' => $searchQuery,
                        'per_page' => $perPage == PHP_INT_MAX ? 'all' : $perPage,
                        'status' => $statusFilter,
                        'start_date' => $startDate,
                        'end_date' => $endDate
                    ],
                    'filters' => $formattedFilters,
                    'batch' => $request->session()->get('batch', [])
                ]);
                
            } catch (\Throwable $e) {
                Log::error('Error querying WNTD data: ' . $e->getMessage(), [
                    'exception' => $e,
                    'request' => $request->all()
                ]);
                
                // Return a fallback response with error message
                return Inertia::render('WNTD/Index', [
                    'sites' => [],
                    'statistics' => [
                        'total' => 0,
                        'unique' => 0,
                        'bandwidth_profiles' => [],
                        'status_distribution' => []
                    ],
                    'get_data' => [
                        'order' => $order,
                        'order_by' => $orderBy,
                        'search' => $searchQuery,
                        'per_page' => $perPage == PHP_INT_MAX ? 'all' : $perPage
                    ],
                    'error' => $e->getMessage(),
                    'batch' => $request->session()->get('batch', [])
                ]);
            }
            
        } catch (\Throwable $e) {
            Log::error('Unhandled exception in WNTD index: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            
            // Return a basic error response
            return Inertia::render('Error/Index', [
                'message' => 'An unexpected error occurred: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Helper method to get column options
     */
    private function getColumnOptions($type)
    {
        try {
            return [
                'hidden_columns' => ColumnOption::where('type', $type)->where('key', 'hide')->pluck('value')->first(),
                'hidden_columns_names' => ColumnOption::where('type', $type)->where('key', 'hide')->pluck('names')->first(),
                'renamed_columns' => ColumnOption::where('type', $type)->where('key', 'rename')->pluck('value')->first(),
                'deleted_columns' => ColumnOption::where('type', $type)->where('key', 'delete')->pluck('value')->first(),
                'arrange_columns' => ColumnOption::where('type', $type)->where('key', 'arrange')->pluck('value')->first(),
            ];
        } catch (\Exception $e) {
            Log::warning('Error getting column options: ' . $e->getMessage());
            return [
                'hidden_columns' => null,
                'hidden_columns_names' => null,
                'renamed_columns' => null,
                'deleted_columns' => null,
                'arrange_columns' => null
            ];
        }
    }
    
    public function save_item(Request $request)
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            'id' => 'nullable|numeric|exists:wntd,id',
            'site_name' => 'required|string|max:255',
            'loc_id' => 'required|string|max:255',
            'wntd' => 'required|string|max:255',
            // Other fields are optional
            'imsi' => 'nullable|string|max:255',
            'version' => 'nullable|string|max:255',
            'avc' => 'nullable|string|max:255',
            'bw_profile' => 'nullable|string|max:255',
            'lon' => 'nullable|numeric',
            'lat' => 'nullable|numeric',
            'home_cell' => 'nullable|string|max:255',
            'home_pci' => 'nullable|string|max:255',
            'traffic_profile' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'solution_type' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'artefacts' => 'nullable'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Process the request data
        $data = $request->all();
        
        // Format any JSON data
        if (isset($data['artefacts']) && is_string($data['artefacts'])) {
            $data['artefacts'] = $this->sanitizeJsonString($data['artefacts']);
        }
        
        DB::beginTransaction();

        try {
            $isNew = !isset($data['id']) || empty($data['id']);
            
            if ($isNew) {
                // Create new record
                $wntd = new WNTD([
                    'site_name' => $data['site_name'] ?? '',
                    'loc_id' => $data['loc_id'] ?? '',
                    'wntd' => $data['wntd'] ?? '',
                    'imsi' => $data['imsi'] ?? '',
                    'version' => $data['version'] ?? '',
                    'avc' => $data['avc'] ?? '',
                    'bw_profile' => $data['bw_profile'] ?? '',
                    'lon' => is_numeric($data['lon'] ?? null) ? $data['lon'] : null,
                    'lat' => is_numeric($data['lat'] ?? null) ? $data['lat'] : null,
                    'home_cell' => $data['home_cell'] ?? '',
                    'home_pci' => $data['home_pci'] ?? '',
                    'traffic_profile' => $data['traffic_profile'] ?? '',
                    'remarks' => $data['remarks'] ?? null,
                    'start_date' => $data['start_date'] ?? null,
                    'end_date' => $data['end_date'] ?? null,
                    'solution_type' => $data['solution_type'] ?? null,
                    'status' => $data['status'] ?? null,
                    'artefacts' => $data['artefacts'] ?? null,
                ]);
                $wntd->save();
                
                DB::commit();
                
                return response()->json([
                    'success' => true, 
                    'message' => 'WNTD site created successfully',
                    'data' => $wntd
                ]);
            } else {
                // Get existing record with pessimistic locking to prevent race conditions
                $id = $data['id'] ?? null;
                
                if (!$id) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Record ID not provided'
                    ], 422);
                }
                
                // Lock the row during update to prevent race conditions
                $wntd = WNTD::lockForUpdate()->find($id);
                
                if (!$wntd) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Record not found'
                    ], 404);
                }
                
                // Update the record
                $wntd->fill([
                    'site_name' => $data['site_name'] ?? $wntd->site_name,
                    'loc_id' => $data['loc_id'] ?? $wntd->loc_id,
                    'wntd' => $data['wntd'] ?? $wntd->wntd,
                    'imsi' => $data['imsi'] ?? $wntd->imsi,
                    'version' => $data['version'] ?? $wntd->version,
                    'avc' => $data['avc'] ?? $wntd->avc,
                    'bw_profile' => isset($data['bw_profile']) ? $data['bw_profile'] : $wntd->bw_profile,
                    'lon' => isset($data['lon']) && is_numeric($data['lon']) ? $data['lon'] : $wntd->lon,
                    'lat' => isset($data['lat']) && is_numeric($data['lat']) ? $data['lat'] : $wntd->lat,
                    'home_cell' => $data['home_cell'] ?? $wntd->home_cell,
                    'home_pci' => $data['home_pci'] ?? $wntd->home_pci,
                    'traffic_profile' => $data['traffic_profile'] ?? $wntd->traffic_profile,
                    'remarks' => $data['remarks'] ?? $wntd->remarks,
                    'start_date' => $data['start_date'] ?? $wntd->start_date,
                    'end_date' => $data['end_date'] ?? $wntd->end_date,
                    'solution_type' => $data['solution_type'] ?? $wntd->solution_type,
                    'status' => $data['status'] ?? $wntd->status,
                    'artefacts' => $data['artefacts'] ?? $wntd->artefacts,
                ]);
                $wntd->save();
                
                DB::commit();
                
                return response()->json([
                    'success' => true, 
                    'message' => 'WNTD site updated successfully',
                    'data' => $wntd
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error saving WNTD record: ' . $e->getMessage(), [
                'exception' => $e,
                'data' => $data
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'An error occurred while saving the record: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Save tracking fields to LocationTracking table with improved concurrency control
     *
     * @param int $siteId
     * @param array $data
     * @return void
     */
    private function saveTrackingFields($siteId, $data)
    {
        // Define tracking fields and their validation rules
        $trackingFields = [
            'start_date' => ['type' => 'date', 'format' => 'Y-m-d'],
            'end_date' => ['type' => 'date', 'format' => 'Y-m-d'],
            'solution_type' => ['type' => 'string', 'max' => 100],
            'status' => ['type' => 'string', 'max' => 50],
            'remarks' => ['type' => 'string'],
            'artifacts' => ['type' => 'json']
        ];
        
        // Get user ID for tracking who made changes
        $userId = auth()->check() ? auth()->id() : 1;
        $userName = auth()->check() ? auth()->user()->name : 'System';
        
        // Get location info for reference
        $location = Location::find($siteId);
        
        if (!$location) {
            Log::error("Failed to save tracking fields - Location ID $siteId not found");
            return;
        }
        
        foreach ($trackingFields as $field => $rules) {
            // Skip if field is not provided or empty
            if (!isset($data[$field]) || $data[$field] === '') {
                continue;
            }
            
            try {
                // Process value based on field type
                $value = $data[$field];
                
                switch ($rules['type']) {
                    case 'date':
                        // Format dates properly for storage
                        if (!empty($value)) {
                            // Try to parse and standardize date format
                            try {
                                $dateObj = new \DateTime($value);
                                $value = $dateObj->format($rules['format']);
                            } catch (\Exception $e) {
                                // If date parsing fails, keep original value but log warning
                                Log::warning("Date parsing failed for field $field: " . $e->getMessage());
                            }
                        }
                        break;
                        
                    case 'json':
                        // Ensure JSON is valid
                        if (is_array($value)) {
                            $value = json_encode($value);
                        } elseif (is_string($value) && !$this->isValidJson($value)) {
                            // Try to fix invalid JSON if needed
                            $fixedValue = $this->sanitizeJsonString($value);
                            if ($this->isValidJson($fixedValue)) {
                                $value = $fixedValue;
                            } else {
                                Log::warning("Invalid JSON in field $field for site $siteId");
                            }
                        }
                        break;
                        
                    case 'string':
                        // Apply length limit if defined
                        if (isset($rules['max']) && strlen($value) > $rules['max']) {
                            $value = substr($value, 0, $rules['max']);
                            Log::warning("Truncated field $field to maximum length of {$rules['max']}");
                        }
                        break;
                }
                
                // Use transaction and locking for this specific tracking update
                DB::beginTransaction();
                
                // Get latest tracking record for this field with pessimistic lock
                $existingTracking = LocationTracking::where('site_id', $siteId)
                    ->where('key', $field)
                    ->lockForUpdate()
                    ->latest()
                    ->first();
                
                // Only create a new tracking record if the value has changed
                $hasChanged = true;
                if ($existingTracking) {
                    $hasChanged = $existingTracking->value !== $value;
                }
                
                if ($hasChanged) {
                    // Create new tracking record
                    $tracking = new LocationTracking();
                    $tracking->site_id = $siteId;
                    $tracking->loc_id = $location->loc_id ?? '';
                    $tracking->user_id = $userId;
                    $tracking->key = $field;
                    $tracking->value = $value;
                    $tracking->save();
                    
                    Log::info("Tracking field '$field' updated for site $siteId by $userName");
                }
                
                DB::commit();
                
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("Error saving tracking field '$field': " . $e->getMessage(), [
                    'site_id' => $siteId,
                    'field' => $field,
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }
    }
    
    /**
     * Check if a string is valid JSON
     *
     * @param string $string
     * @return bool
     */
    private function isValidJson($string)
    {
        if (!is_string($string)) {
            return false;
        }
        
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }
    
    /**
     * Attempt to sanitize and fix a JSON string
     *
     * @param string $string
     * @return string
     */
    private function sanitizeJsonString($string)
    {
        // Common JSON format issues to fix
        $string = trim($string);
        
        // Try to handle common JSON errors
        if (substr($string, 0, 1) !== '[' && substr($string, 0, 1) !== '{') {
            // If not starting with [ or {, try to make it an array
            $string = '[' . $string . ']';
        }
        
        // Replace single quotes with double quotes (common error)
        $string = str_replace("'", '"', $string);
        
        return $string;
    }
    
    public function show($id)
    {
        try {
            // Find WNTD record
            $wntd = WNTD::findOrFail($id);
            
            // Get change history
            $historyRecords = DB::table('wntd_history')
                ->where('wntd_id', $id)
                ->orderBy('created_at', 'desc')
                ->leftJoin('users', 'wntd_history.user_id', '=', 'users.id')
                ->select(
                    'wntd_history.*',
                    'users.name as user_name'
                )
                ->limit(100) // Limit to most recent 100 changes for performance
                ->get();
            
            // Group history by field_name for timeline view
            $historyByField = $historyRecords->groupBy('field_name');
            
            // Format history for timeline view
            $timeline = $historyRecords->map(function($item) {
                return [
                    'id' => $item->id,
                    'field_name' => $item->field_name,
                    'old_value' => $item->old_value,
                    'new_value' => $item->new_value,
                    'user_id' => $item->user_id,
                    'user_name' => $item->user_name ?? 'Unknown',
                    'change_type' => $item->change_type,
                    'created_at' => $item->created_at,
                    'formatted_date' => (new Carbon($item->created_at))->format('Y-m-d H:i:s'),
                    'category' => $this->categorizeChangeType($item->field_name)
                ];
            });
            
            // Create user-friendly field labels
            $fieldLabels = [
                'site_name' => 'Site Name',
                'loc_id' => 'Location ID',
                'wntd' => 'WNTD',
                'imsi' => 'IMSI',
                'version' => 'Version',
                'avc' => 'AVC',
                'bw_profile' => 'Bandwidth Profile',
                'home_cell' => 'Home Cell',
                'home_pci' => 'Home PCI',
                'traffic_profile' => 'Traffic Profile',
                'lon' => 'Longitude',
                'lat' => 'Latitude',
                'remarks' => 'Remarks',
                'start_date' => 'Start Date',
                'end_date' => 'End Date',
                'solution_type' => 'Solution Type',
                'status' => 'Status',
                'artefacts' => 'Artefacts'
            ];
            
            return Inertia::render('WNTD/Show', [
                'wntd' => $wntd,
                'timeline' => $timeline,
                'historyByField' => $historyByField,
                'fieldLabels' => $fieldLabels
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error showing WNTD record: ' . $e->getMessage(), [
                'exception' => $e,
                'id' => $id
            ]);
            
            return redirect()->route('wntd.field.name.index')
                ->with('error', 'Error showing WNTD record: ' . $e->getMessage());
        }
    }
    
    /**
     * Edit WNTD record
     */
    public function edit($id)
    {
        try {
            // Find WNTD record
            $wntd = WNTD::findOrFail($id);
            
            // Create user-friendly field labels
            $fieldLabels = [
                'site_name' => 'Site Name',
                'loc_id' => 'Location ID',
                'wntd' => 'WNTD',
                'imsi' => 'IMSI',
                'version' => 'Version',
                'avc' => 'AVC',
                'bw_profile' => 'Bandwidth Profile',
                'home_cell' => 'Home Cell',
                'home_pci' => 'Home PCI',
                'traffic_profile' => 'Traffic Profile',
                'lon' => 'Longitude',
                'lat' => 'Latitude',
                'remarks' => 'Remarks',
                'start_date' => 'Start Date',
                'end_date' => 'End Date',
                'solution_type' => 'Solution Type',
                'status' => 'Status',
                'artefacts' => 'Artefacts'
            ];
            
            return Inertia::render('WNTD/Edit', [
                'wntd' => $wntd,
                'fieldLabels' => $fieldLabels
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error editing WNTD record: ' . $e->getMessage(), [
                'exception' => $e,
                'id' => $id
            ]);
            
            return redirect()->route('wntd.field.name.index')
                ->with('error', 'Error editing WNTD record: ' . $e->getMessage());
        }
    }
    
    /**
     * Categorize changes by type for better organization in history view
     */
    private function categorizeChangeType($key)
    {
        $categories = [
            'dates' => ['start_date', 'end_date'],
            'status' => ['status'],
            'artifacts' => ['artefacts'],
            'identification' => ['site_name', 'loc_id', 'wntd', 'imsi'],
            'technical' => ['version', 'avc', 'bw_profile', 'home_cell', 'home_pci', 'traffic_profile'],
            'location' => ['lon', 'lat']
        ];
        
        foreach ($categories as $category => $keys) {
            if (in_array($key, $keys)) {
                return $category;
            }
        }
        
        return 'other';
    }
    
    public function destroy($id)
    {
        DB::table('wntd')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
    
    public function add_row(Request $request)
    {
        $item = $request->newItem;
        
        $id = DB::table('wntd')->insertGetId([
            'site_name' => $item['site_name'] ?? '',
            'loc_id' => $item['loc_id'] ?? '',
            'wntd' => $item['wntd'] ?? '',
            'imsi' => $item['imsi'] ?? '',
            'version' => $item['version'] ?? '',
            'avc' => $item['avc'] ?? '',
            'bw_profile' => $item['bw_profile'] ?? '',
            'lon' => $item['lon'] ?? null,
            'lat' => $item['lat'] ?? null,
            'home_cell' => $item['home_cell'] ?? '',
            'home_pci' => $item['home_pci'] ?? '',
            'traffic_profile' => $item['traffic_profile'] ?? '',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        return response()->json(['success' => true, 'id' => $id]);
    }
    
    /**
     * Export WNTD data in various formats
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
     */
    public function export(Request $request)
    {
        try {
            $format = $request->query('format', 'xlsx');
            $wntdData = WNTD::all();

            switch ($format) {
                case 'xlsx':
                    return $this->exportToExcel($wntdData);
                case 'csv':
                    return $this->exportToCsv($wntdData);
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Unsupported export format'
                    ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Export error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export data to Excel format
     */
    private function exportToExcel($wntdData)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        
        // First worksheet for WNTD data
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('WNTD Data');
        
        // Set headers with corrected order
        $headers = [
            'ID', 'Location ID', 'WNTD', 'IMSI', 'Version',
            'AVC', 'BW Profile', 'Longitude', 'Latitude', 'Site Name',
            'Home Cell', 'Home PCI', 'Traffic Profile', 'Status', 'Start Date', 
            'End Date', 'Solution Type', 'Remarks', 'Created At', 'Updated At'
        ];
        $sheet->fromArray([$headers], NULL, 'A1');
        
        // Add data with corrected order
        $row = 2;
        foreach ($wntdData as $wntd) {
            $sheet->fromArray([[
                $wntd->id,
                $wntd->loc_id,
                $wntd->wntd,
                $wntd->imsi,
                $wntd->version,
                $wntd->avc,
                $wntd->bw_profile,
                $wntd->lon,
                $wntd->lat,
                $wntd->site_name,
                $wntd->home_cell,
                $wntd->home_pci,
                $wntd->traffic_profile,
                $wntd->status,
                $wntd->start_date,
                $wntd->end_date,
                $wntd->solution_type,
                $wntd->remarks,
                $wntd->created_at,
                $wntd->updated_at
            ]], NULL, "A{$row}");
            $row++;
        }
        
        // Auto-size columns
        foreach (range('A', 'T') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        
        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $filename = 'wntd_export_' . date('Y-m-d_His') . '.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'wntd_');
        $writer->save($tempFile);
        
        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Export data to CSV format
     */
    private function exportToCsv($wntdData)
    {
        $filename = 'wntd_export_' . date('Y-m-d_His') . '.csv';
        $tempFile = tempnam(sys_get_temp_dir(), 'wntd_');
        
        $file = fopen($tempFile, 'w');
        fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
        
        // Write headers with corrected order
        $headers = [
            'ID', 'Location ID', 'WNTD', 'IMSI', 'Version',
            'AVC', 'BW Profile', 'Longitude', 'Latitude', 'Site Name',
            'Home Cell', 'Home PCI', 'Traffic Profile', 'Status', 'Start Date', 
            'End Date', 'Solution Type', 'Remarks', 'Created At', 'Updated At'
        ];
        fputcsv($file, $headers);
        
        // Write data with corrected order
        foreach ($wntdData as $wntd) {
            fputcsv($file, [
                $wntd->id,
                $wntd->loc_id,
                $wntd->wntd,
                $wntd->imsi,
                $wntd->version,
                $wntd->avc,
                $wntd->bw_profile,
                $wntd->lon,
                $wntd->lat,
                $wntd->site_name,
                $wntd->home_cell,
                $wntd->home_pci,
                $wntd->traffic_profile,
                $wntd->status,
                $wntd->start_date,
                $wntd->end_date,
                $wntd->solution_type,
                $wntd->remarks,
                $wntd->created_at,
                $wntd->updated_at
            ]);
        }
        
        fclose($file);
        
        return response()->download($tempFile, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ])->deleteFileAfterSend(true);
    }

    /**
     * Handle file import 
     */
    public function import_from_csv(Request $request)
    {
        try {
            // Validate the uploaded file
            $validator = Validator::make($request->all(), [
                'file' => [
                    'required',
                    'file',
                    'mimes:csv,txt',
                    'max:10240', // 10MB max
                ],
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            if (!$request->hasFile('file')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No file was uploaded'
                ], 422);
            }
            
            $file = $request->file('file');
            
            // Check if the file is empty
            if ($file->getSize() == 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'The uploaded file is empty'
                ], 422);
            }
            
            // Store the file
            $path = $file->store('csv');
            
            try {
                // Read CSV headers
                $reader = Reader::createFromPath(storage_path('app/' . $path), 'r');
                $reader->setHeaderOffset(0);
                
                $header = $reader->getHeader();
                
                // Make sure we have the required columns
                $requiredColumns = ['site_name', 'wntd'];
                $missingColumns = array_diff($requiredColumns, $header);
                
                if (count($missingColumns) > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'The CSV file is missing required columns: ' . implode(', ', $missingColumns)
                    ], 422);
                }
                
                // Get sample rows for preview
                $records = $reader->getRecords();
                $count = 0;
                $sample = [];
                
                foreach ($records as $record) {
                    if ($count < 5) {
                        $sample[] = $record;
                    }
                    $count++;
                    
                    if ($count >= 5) {
                        break;
                    }
                }
                
                // Return success with file path, header and sample for mapping
                return response()->json([
                    'success' => true,
                    'path' => $path,
                    'header' => $header,
                    'sample' => $sample,
                    'total_rows' => $count
                ]);
                
            } catch (\Exception $e) {
                // Delete the file if parsing fails
                \Storage::delete($path);
                
                Log::error('CSV parsing error: ' . $e->getMessage(), [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to parse CSV file: ' . $e->getMessage()
                ], 422);
            }
            
        } catch (\Exception $e) {
            Log::error('File upload error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'File upload failed: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Map and save CSV data
     */
    public function map_and_save_csv(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'mappings' => 'required|array',
                'file_path' => 'required|string',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Get the full path of the uploaded file
            $path = storage_path('app/' . $request->file_path);
            
            if (!file_exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }
            
            // Read CSV data
            $csv = Reader::createFromPath($path, 'r');
            $csv->setHeaderOffset(0);
            $records = iterator_to_array($csv->getRecords());
            
            // Get column mappings
            $mappings = $request->mappings;
            
            // Batch size for processing
            $batchSize = 100;
            $batches = array_chunk($records, $batchSize);
            
            $batchJobs = [];
            
            foreach ($batches as $batch) {
                $batchJobs[] = new ProcessWNTDFieldImport($mappings, $batch);
            }
            
            // Check if PostgreSQL is being used for database-specific optimizations
            $isPostgres = DB::connection()->getDriverName() === 'pgsql';
            
            // Use queue for the import job
            $importBatch = Bus::batch($batchJobs)
                ->name("WNTD Import: " . basename($path))
                ->dispatch();
            
            // Clean up temporary file if needed
            if (strpos($request->file_path, 'temp') !== false) {
                \Storage::delete($request->file_path);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Import job started successfully',
                'batch_id' => $importBatch->id,
                'total_rows' => count($records)
            ]);
        } catch (\Exception $e) {
            Log::error('Error in map_and_save_csv: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to process CSV: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Save artifacts (file uploads) with improved security
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function save_artifacts(Request $request)
    {
        // Validate basic request data
        $validator = Validator::make($request->all(), [
            'site_id' => 'required|exists:wntd,id',
            'artifacts' => 'required|array',
            'artifacts.*' => 'required|file|max:10240' // 10MB max per file
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors(),
                'message' => 'Validation failed. Please check your input.'
            ], 422);
        }
        
        try {
            // Start transaction for database consistency
            DB::beginTransaction();
            
            $siteId = $request->input('site_id');
            $wntd = WNTD::findOrFail($siteId);
            $userId = auth()->id();
            
            // Get existing artifacts if any
            $existingArtifacts = $wntd->artefacts ? json_decode($wntd->artefacts, true) : [];
            if (!is_array($existingArtifacts)) {
                $existingArtifacts = [$existingArtifacts];
            }
            
            // Process uploaded files
            $newArtifacts = [];
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
            $allowedMimes = [
                'image/jpeg', 'image/png', 'application/pdf', 
                'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain', 'text/csv'
            ];
            
            foreach ($request->file('artifacts') as $file) {
                // Validate file type for security
                $extension = strtolower($file->getClientOriginalExtension());
                $mime = $file->getMimeType();
                
                if (!in_array($extension, $allowedExtensions) || !in_array($mime, $allowedMimes)) {
                    continue; // Skip invalid files
                }
                
                // Generate secure filename with site reference
                $fileName = $siteId . '_' . time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $file->getClientOriginalName());
                
                // Store file securely
                $path = $file->storeAs(
                    'public/artifacts/' . $siteId,
                    $fileName
                );
                
                if ($path) {
                    $publicPath = str_replace('public/', '/storage/', $path);
                    $newArtifacts[] = $publicPath;
                }
            }
            
            // Combine existing and new artifacts
            $allArtifacts = array_merge($existingArtifacts, $newArtifacts);
            
            // Update the WNTD record with new artifacts
            $wntd->artefacts = json_encode($allArtifacts);
            $wntd->save();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Artifacts uploaded successfully',
                'artifacts' => $allArtifacts
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error uploading artifacts: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => app()->environment('local') ? $e->getMessage() : 'An error occurred while uploading files',
                'message' => 'Failed to upload artifacts'
            ], 500);
        }
    }

    /**
     * Generate and download a template file
     */
    public function downloadTemplate($targetTable, $format)
    {
        try {
            // Validate parameters
            if ($targetTable !== 'wntd') {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid table specified'
                ], 400);
            }
            
            if (!in_array($format, ['excel', 'csv'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid format specified'
                ], 400);
            }
            
            // Create a spreadsheet
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Get the header columns
            $headers = $this->getTemplateHeaders();
            
            // Set headers in the first row
            $columnIndex = 1;
            foreach ($headers as $header) {
                $sheet->setCellValueByColumnAndRow($columnIndex++, 1, $header);
            }
            
            // Add some sample data in the second row
            $sampleData = [
                'Site A', 'LOC001', 'WNTD123', '12345678901234', 
                '12.3456', '45.6789', 'Active', date('Y-m-d H:i:s')
            ];
            
            // Add sample data row
            $columnIndex = 1;
            foreach ($sampleData as $value) {
                $sheet->setCellValueByColumnAndRow($columnIndex++, 2, $value);
            }
            
            // Style the header row
            $headerRange = 'A1:' . \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers)) . '1';
            $sheet->getStyle($headerRange)->getFont()->setBold(true);
            $sheet->getStyle($headerRange)->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D3D3D3');
                
            // Auto-size columns for better readability
            foreach (range(1, count($headers)) as $col) {
                $sheet->getColumnDimensionByColumn($col)->setAutoSize(true);
            }
            
            // Create the writer based on format
            if ($format === 'csv') {
                $writer = new Csv($spreadsheet);
                $contentType = 'text/csv';
                $extension = 'csv';
            } else {
                $writer = new Xlsx($spreadsheet);
                $contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                $extension = 'xlsx';
            }
            
            // Prepare response
            $filename = "wntd_template.{$extension}";
            
            // Create a temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'template_');
            $writer->save($tempFile);
            
            // Return the file
            return response()->file($tempFile, [
                'Content-Type' => $contentType,
                'Content-Disposition' => "attachment; filename={$filename}"
            ])->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get template headers
     */
    private function getTemplateHeaders()
    {
        return [
            'Site Name', 'Location ID', 'WNTD', 'IMSI', 
            'Latitude', 'Longitude', 'Status', 'Last Update'
        ];
    }

    /**
     * Import WNTD data from file
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls,csv,txt',
                'columnMappings' => 'required|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $columnMappings = $request->input('columnMappings');
            
            // Store the file
            $filePath = $file->store('temp');
            
            // Use the import service
            $importService = app(WNTDImportService::class);
            $result = $importService->importFromFile($filePath, $columnMappings);
            
            return response()->json($result);
            
        } catch (\Exception $e) {
            Log::error('WNTD import error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error importing data: ' . $e->getMessage()
            ], 500);
        }
    }
} 