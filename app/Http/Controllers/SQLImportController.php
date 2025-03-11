<?php
namespace App\Http\Controllers;

use App\Models\ImportDB;
use App\Models\Location;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Response;
use PDO;
class SQLImportController extends Controller
{
    public function index($id)
    {
        $db = ImportDB::find($id);
        try {
            if($db->dbtype=='starburst'){
                
                return Inertia::render('SQLImport/Index', [
                    'tablesNames' => [],
                    'columnsName'=>[],
                    'dbtype'=>'starburst'
                ]);

            }        
            else{
            config([
                'database.connections.import' => [
                    'driver' => $db->dbtype,
                    'host' => $db->host,
                    'port' => $db->port,
                    'database' => $db->database,
                    'username' => $db->username,
                    'password' => $db->password,
                    'charset' => $db->dbtype == 'mysql' ? 'utf8mb4' : 'utf8',
                    'collation' => $db->dbtype == 'mysql' ? 'utf8mb4_unicode_ci' : '',
                    'prefix' => '',
                    'strict' => true,
                    'engine' => null,
                ]
            ]);
        
            // Set the new connection as default
            DB::setDefaultConnection('import');
        
            $tablesNames = [];
            $columnsByTable = [];
        
            if ($db->dbtype == 'mysql') {
                $tables = DB::select('SHOW TABLES');
				// Get the database name dynamically
				$databaseName = DB::connection()->getDatabaseName();
				$tablesNames = [];
				$columnsByTable = [];

				// Iterate over each table and fetch its columns
				foreach ($tables as $table) {
					// Access the table name dynamically using the property 'Tables_in_<database_name>'
					$tableName = $table->{'Tables_in_' . $databaseName};

					// Add table name to the array
					$tablesNames[] = $tableName;

					// Fetch columns of the table, making sure to escape the table name with backticks
					$columns = DB::select("SHOW COLUMNS FROM `{$tableName}`");
					//dd($columns);
					// Store the columns by table
					// Map columns to match the expected keys: 'column_name' and 'data_type'
					$columns = array_map(function ($column) {
						return [
							'column_name' => $column->Field,  // map 'Field' to 'column_name'
							'data_type' => $column->Type,     // map 'Type' to 'data_type'
						];
					}, $columns);

					// Store the columns by table
					$columnsByTable[$tableName] = $columns;
				}
            } elseif ($db->dbtype == 'pgsql') {
                // Fetch all table names
                $tables = DB::select("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        
                // Iterate over each table and fetch its columns
                foreach ($tables as $table) {
                    $tableName = $table->tablename;
                    $tablesNames[] = $tableName;
        
                    // Fetch columns of the table
                    $columns = DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ?", [$tableName]);
                    $columnsByTable[$tableName] = $columns;
                }
            } else {
                throw new Exception("Unsupported database type: " . $db->dbtype);
            }
        }
        } catch (\Exception $e) {
            return response()->json(['error' => ['message' => $e->getMessage()]], 500);
        }
       

        return Inertia::render('SQLImport/Index', [
            'tablesNames' => $tablesNames,
            'columnsName' => $columnsByTable,
            'dbtype'=>'others'
        ]);     
    }

public function import_starburst($id)
{
    // Calculate offset and limit based on the page number
    $db = ImportDB::find($id);
    $page = $_GET['page'] ?? 1;  // Page number from request (defaults to 1 if not provided)
    $limit = 10;
    $offset = (($page - 1) * $limit)-10;  // First time we are loading predefined tables so when we do loadmore we are assuming 2nd page as 1st page internally.
    $host = $db->host;
    $port = $db->port;
    $database = $db->database;
    $catalog = $db->catalog;
    $username = $db->username;
    $password = $db->password;

    // Prepare the configuration data
    $dbConfig = [
        'host' => $host,
        'port' => $port,
        'database' => $database,
        'catalog' => $catalog,
        'username' => $username,
        'password' => $password
    ];

    // Generate the JSON file (store it in a secure location)
    $jsonFilePath = storage_path('app/trino-config.json');
    if (file_put_contents($jsonFilePath, json_encode($dbConfig, JSON_PRETTY_PRINT)) === false) {
        return response()->json(['error' => 'Failed to write JSON file'], 500);
    }

    // Check if it's the first page load
    if ($page == 1) {
        // Predefined table names for the first load
        $tableNames = ['v_wireless_pm_enodeb_e_utran_cell_hourly_local', 'v_wireless_pm_gnodeb_nr_cell_hourly_local', 'v_wireless_pm_enodeb_e_utran_cell_bh_local', 'v_wireless_pm_gnodeb_nr_cell_bh_local', 'v_cur_eps_inventory_avc_connection', 'v_cur_eps_inventory_installed_wntd', 'v_eps_inventory_avc_connection', 'v_eps_inventory_installed_wntd', 'v_ngdm_tr143_tc4', 'v_ngdm_wntd_performance'];
    } else {
        // Query to fetch table names with row numbers
        $query1 = "WITH numbered_tables AS (SELECT table_name, ROW_NUMBER() OVER (ORDER BY table_name) AS row_num FROM information_schema.tables WHERE table_schema = '".$db->database."') SELECT table_name FROM numbered_tables WHERE row_num BETWEEN $offset + 1 AND " . ($offset + $limit);
        Log::info('command1:', ['command' => $query1]);
        // Run the query for table names
        $command1 = "node " . base_path('resources/js/trino-client.js') . " \"$query1\"";
        $output1 = shell_exec($command1);
        
        // Decode the output from the node script
        $decodedOutput1 = json_decode($output1, true);
        
        // Check if we received valid table names
        if ($decodedOutput1 && isset($decodedOutput1['filteredResults'])) {
            $tableNames = array_map(function ($item) {
                return $item[0];  // Accessing the first element of each inner array
            }, $decodedOutput1['filteredResults']);
        } else {
            return response()->json(['error' => 'Invalid data returned from Trino query for table names'], 500);
        }
    }

    // Convert the table names to a comma-separated string for use in the next query
    $tableNamesList = implode("', '", $tableNames);
    
    // Query to fetch column names and data types for the filtered tables
    $query2 = "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = '".$db->database."' AND table_name IN ('$tableNamesList')";
    
    // Run the query for columns and data types
    $command2 = "node " . base_path('resources/js/trino-client.js') . " \"$query2\"";
    $output2 = shell_exec($command2);
    
    // Decode the output from the node script
    $decodedOutput2 = json_decode($output2, true);

    // Ensure we have valid data for columns
    if ($decodedOutput2 && isset($decodedOutput2['filteredResults'])) {
        // Format the columns data as per your required output
        $columnsFormatted = array_map(function ($item) {
            return '"' . $item[0] . '","' . $item[1] . '","' . $item[2] . '"';
        }, $decodedOutput2['filteredResults']);
        
        return response()->json([
            'tablesNames' => $tableNames,  // Return the tables' names
            'columnsName' => $columnsFormatted // Return formatted column names
        ]);
    } else {
        return response()->json(['error' => 'Invalid data returned from Trino query for columns'], 500);
    }
    }

    
    public function run_sql_code(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer',
            'sql_query' => 'required|string|min:1',
            'table_name' => 'nullable|string',
        ], [
            'sql_query.required' => 'SQL query cannot be empty',
            'sql_query.min' => 'SQL query cannot be empty',
            'id.required' => 'Database connection ID is required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'message' => $validator->errors()->first(),
                    'type' => 'validation_error'
                ]
            ], 422);
        }
        
        $sql_code = trim($request->input('sql_query'));
        
        // Additional validation for SQL query
        if (empty($sql_code)) {
            return response()->json([
                'error' => [
                    'message' => 'SQL query cannot be empty',
                    'type' => 'validation_error'
                ]
            ], 422);
        }

        try {
            $result = $this->db_connection($request->input('id'), $sql_code, $request->input('table_name'));
            return $result;
        } catch (\Exception $e) {
            Log::error('SQL Query Error:', [
                'query' => $sql_code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => [
                    'message' => $this->formatErrorMessage($e->getMessage()),
                    'type' => 'execution_error',
                    'query' => $sql_code
                ]
            ], 500);
        }
    }

    private function formatErrorMessage($message)
    {
        // Remove sensitive information from error messages
        $message = preg_replace('/\b(?:password|user|host)\b=\'[^\']+\'/', '[REDACTED]', $message);
        
        // Make error messages more user-friendly
        $commonErrors = [
            'relation "([^"]+)" does not exist' => 'Table "$1" does not exist',
            'column "([^"]+)" does not exist' => 'Column "$1" does not exist',
            'syntax error at or near "([^"]+)"' => 'Syntax error near "$1"',
            'permission denied' => 'You do not have permission to execute this query',
        ];
        
        foreach ($commonErrors as $pattern => $replacement) {
            if (preg_match("/$pattern/i", $message, $matches)) {
                return preg_replace("/$pattern/i", $replacement, $message);
            }
        }
        
        return $message;
    }

    public function db_connection($id, $sql_code, $table_name)
    {
        $filePath = storage_path('/trino/trino.jar');
        $db = ImportDB::find($id);
      
        if (!$db) {
            return response()->json(['error' => ['message' => 'Database configuration not found']], 404);
        }

        try {
           if($db->dbtype == 'starburst'){
                // Exploding the table name to separate schema and table
                $table_parts = explode('.', $table_name);
                // Get the table name only (last part of the array)
                $table_name_only = end($table_parts);
                
                // Validate SQL code before execution
                $sql_code = trim($sql_code);
                if (empty($sql_code)) {
                    return response()->json(['error' => ['message' => 'SQL query cannot be empty']], 400);
                }
                
                // Prevent destructive actions (optional - remove if users need to run these)
                $destructivePatterns = ['/\bDROP\s+TABLE\b/i', '/\bTRUNCATE\s+TABLE\b/i', '/\bDROP\s+DATABASE\b/i'];
                foreach ($destructivePatterns as $pattern) {
                    if (preg_match($pattern, $sql_code)) {
                        return response()->json(['error' => ['message' => 'Destructive operations like DROP or TRUNCATE are not allowed in SQL Explorer']], 403);
                    }
                }
                
                // Check if the query already contains 'LIMIT' clause (case-insensitive)
                $limit = 5000; // Number of rows to fetch
                $start_id = request()->get('last_id'); // Get the last ID passed from the frontend
                
                // Track execution time
                $startTime = microtime(true);
                
                // Ensure LIMIT is applied (this should only happen once)
                if (stripos($sql_code, "LIMIT") === false) {
                    // Add LIMIT to the query
                    $sql_code .= " LIMIT " . intval($limit);  // Convert to integer to prevent SQL injection
                }
                
                // If a start ID is provided, adjust the query to fetch only records after that ID
                if ($start_id) {
                    // Only add WHERE clause if there isn't one already
                    if (stripos($sql_code, "WHERE") === false) {
                        $sql_code .= " WHERE id > " . intval($start_id); // Convert to integer to prevent SQL injection
                    } else {
                        // If there's already a WHERE clause, add with AND
                        $sql_code = preg_replace('/WHERE/i', 'WHERE id > ' . intval($start_id) . ' AND ', $sql_code, 1);
                    }
                }
                
                // Check if the query contains a SELECT statement and extract column names
                preg_match('/SELECT\s+(.*?)\s+FROM/i', $sql_code, $matches);
                
                $start = microtime(true); // Start time for query execution
                
                // Execute the query using the separate Node.js script
                $command = "node " . base_path('resources/js/trino-client.js') . " \"$sql_code\"";
                $output = shell_exec($command);
                
                // Calculate execution time
                $executionTime = round((microtime(true) - $start) * 1000); // in milliseconds
                
                // Check for errors in the output
                if ($this->has_error($output)) {
                    Log::error('SQL Query Error:', ['output' => $output, 'query' => $sql_code]);
                    return response()->json([
                        'error' => ['message' => 'Error executing query: ' . $output],
                        'executionTime' => $executionTime
                    ], 400);
                }
                
                // Decode the JSON output
                $decodedOutput = json_decode($output, true);
                
                // Check if we have valid results
                if (!isset($decodedOutput['filteredResults'])) {
                    return response()->json([
                        'error' => ['message' => 'Invalid result format from database query'],
                        'executionTime' => $executionTime
                    ], 500);
                }
                
                // Return the filtered results
                return response()->json([
                    'executionTime' => $executionTime,
                    'rowCount' => count($decodedOutput['filteredResults']),
                    'success' => true,
                    'data' => $decodedOutput['filteredResults']
                ]);

            } else {
                // Configure database connection based on the database type
                config([
                    'database.connections.import' => [
                        'driver' => $db->dbtype,
                        'host' => $db->host,
                        'port' => $db->port,
                        'database' => $db->database,
                        'username' => $db->username,
                        'password' => $db->password,
                        'charset' => $db->dbtype == 'mysql' ? 'utf8mb4' : 'utf8',
                        'collation' => $db->dbtype == 'mysql' ? 'utf8mb4_unicode_ci' : '',
                        'prefix' => '',
                        'strict' => true,
                        'engine' => null,
                    ]
                ]);
                
                DB::setDefaultConnection('import');
                
                // Validate SQL code before execution
                $sql_code = trim($sql_code);
                if (empty($sql_code)) {
                    return response()->json(['error' => ['message' => 'SQL query cannot be empty']], 400);
                }
                
                // Prevent destructive actions
                $destructivePatterns = ['/\bDROP\s+TABLE\b/i', '/\bTRUNCATE\s+TABLE\b/i', '/\bDROP\s+DATABASE\b/i'];
                foreach ($destructivePatterns as $pattern) {
                    if (preg_match($pattern, $sql_code)) {
                        return response()->json(['error' => ['message' => 'Destructive operations like DROP or TRUNCATE are not allowed in SQL Explorer']], 403);
                    }
                }
                
                // Track execution time
                $startTime = microtime(true);
                
                try {
                    // Execute the query
                    $result = DB::select($sql_code);
                    
                    // Calculate execution time
                    $executionTime = round((microtime(true) - $startTime) * 1000); // in milliseconds
                    
                    return response()->json([
                        'executionTime' => $executionTime,
                        'rowCount' => count($result),
                        'success' => true,
                        'data' => $result
                    ]);
                    
                } catch (\Exception $e) {
                    Log::error('SQL Query Error: ' . $e->getMessage(), ['query' => $sql_code]);
                    return response()->json([
                        'error' => ['message' => $e->getMessage()],
                        'executionTime' => round((microtime(true) - $startTime) * 1000)
                    ], 400);
                }
            }
        } catch (\Exception $e) {
            Log::error('SQL Query Exception: ' . $e->getMessage(), ['query' => $sql_code]);
            return response()->json(['error' => ['message' => $e->getMessage()]], 500);
        }
    }

    private function executeQuery($connection, $sql)
    {
        try {
            // Use prepared statements when possible
            // For complex queries that can't use prepared statements directly, consider using query builders
            // or validating the SQL against a whitelist of allowed operations
            return $connection->select(DB::raw($sql));
        } catch (\Exception $e) {
            return response()->json(['error' => ['message' => $e->getMessage()]], 500);
        }
    }

    public function store(Request $request)
    {
        if (is_array($request->data)) {
            $data = $request->data;
            foreach ($data as $item) {
                $existingWntd = DB::table('wntd')->where('loc_id', $item['loc_id']?$item['loc_id']:$item['LOCID'])->first();
                if (!$existingWntd) {
                    DB::table('wntd')->insert([
                        'loc_id' =>  $item['loc_id']?$item['loc_id']:$item['LOCID'],
                        'wntd' => $item['wntd']?$item['wntd']:$item['WNTD'],
                        'imsi' => $item['imsi']?$item['imsi']:$item['IMSI'],
                        'version' => $item['version']?$item['version']:$item['VERSION'],
                        'avc' => $item['avc']?$item['avc']:$item['AVC'],
                        'bw_profile' => $item['bw_profile']?$item['bw_profile']:$item['BW_PROFILE'],
                        'lon' => $item['lon']?$item['lon']:$item['LON'],
                        'lat' => $item['lat']?$item['lat']:$item['LAT'],
                        'site_name' => $item['site_name']?$item['site_name']:$item['SITE_NAME'],
                        'home_cell' =>$item['home_cell']?$item['home_cell']:$item['HOME_CELL'],
                        'home_pci' => $item['home_pci']?$item['home_pci']:$item['HOME_PCI'],
                        'traffic_profile' => $item['traffic_profile']?$item['traffic_profile']:$item['TRAFFIC_PROFILE'],
                    ]);
                } else {
                    $locId=$item['loc_id']?$item['loc_id']:$item['LOCID'];
                    return response()->json([
                        'error' => array(
                            'message' => 'Site with LOCID ' .  $locId . ' already exists',
                        )
                    ], 500);
                }
            }
            return response()->json([
                'success' => array(
                    'message' => 'Data imported successfully.',
                )
            ], 200);
        }
    }

    function get_db_data($command, $password) {
        $pipes = [];
        $descriptorspec = [
            0 => ['pipe', 'r'],  // stdin (input)
            1 => ['pipe', 'w'],  // stdout (output)
            2 => ['pipe', 'w'],  // stderr (error)
        ];
    
        $process = proc_open($command, $descriptorspec, $pipes);
    
        $output = '';
        if (is_resource($process)) {
            // Write the password to stdin
            fwrite($pipes[0], $password . PHP_EOL);
            fclose($pipes[0]);
    
            // Incrementally read stdout and stderr without blocking
            while (!feof($pipes[1])) {
                $output .= fgets($pipes[1]);  // Read the output one line at a time
            }
    
            // Optionally, read the error output
            $error = '';
            while (!feof($pipes[2])) {
                $error .= fgets($pipes[2]);  // Read error output if any
            }
    
            fclose($pipes[1]);
            fclose($pipes[2]);
    
            $return_value = proc_close($process);
        }
        // Get the size of the output
        /*$output_size_bytes = strlen($output);
        // Convert the size to megabytes
        $output_size_mb = $output_size_bytes / (1024 * 1024);
        dd($output_size_bytes);*/
        return $output;
    }
    // Function to check if there is any error in the output
    public function has_error($output) {
        // Check if there is any error message in the output (could be Starburst's error format)
        return strpos(strtolower($output), 'error') !== false || strpos(strtolower($output), 'exception') !== false;
    }
    
}