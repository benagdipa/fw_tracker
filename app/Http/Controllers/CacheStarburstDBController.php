<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\ImportDB;

class CacheStarburstDBController extends Controller
{
    public function cacheDatabaseData($id)
    {
        $db = ImportDB::find($id);
    
        try {
            if ($db->dbtype == 'starburst') {
                $filePath = storage_path('/trino/trino.jar'); // Update with your actual file path
                $command = 'java -jar ' . $filePath . ' --server ' . $db->host . ':' . $db->port . ' --catalog ' . $db->catalog . '  --schema ' . $db->database . '  --user ' . $db->username . ' --password --execute "show tables" --insecure';
                $command3 = 'java -jar ' . $filePath . ' --server ' . $db->host . ':' . $db->port . ' --catalog ' . $db->catalog . '  --schema ' . $db->database . ' --user ' . $db->username . ' --password --execute "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = \'' . $db->database . '\'" --insecure';
    
                $password = $db->password;
    
                $cacheKeyTables = 'db_tables_' . $db->host . ':' . $db->port . '_' . $db->catalog . '_' . $db->username;
                $cacheKeyColumns = 'db_columns_' . $db->host . ':' . $db->port . '_' . $db->catalog . '_' . $db->username;
    
                // Delete existing cache keys
                Cache::forget($cacheKeyTables);
                Cache::forget($cacheKeyColumns);
    
                // Fetch new data and cache it
                $output = $this->get_db_data($command, $password);
                Cache::forever($cacheKeyTables, $output); // Cache the result forever
    
                $output3 = $this->get_db_data($command3, $password);
                Cache::forever($cacheKeyColumns, $output3); // Cache the result forever
    
                Log::info('Tables cached:', ['tables' => $output]);
                Log::info('Columns cached:', ['columns' => $output3]);
            }
            return response()->json(['message' => 'Cache flushed successfully.']);
        } catch (\Exception $e) {
            //Log::error('Error caching database data:', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to flush cache.'], 500);
        }
    }

    private function get_db_data($command, $password)
    {
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

        return $output;
    }
}