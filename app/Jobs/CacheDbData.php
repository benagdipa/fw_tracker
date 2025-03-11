<?php

namespace App\Jobs;

use Cache;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use DB;

class CacheDbData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $db;
    protected $command;
    protected $command3;
    protected $cacheKeyTables;
    protected $cacheKeyColumns;

    public function __construct($db, $command, $command3, $cacheKeyTables, $cacheKeyColumns)
    {
        $this->db = $db;
        $this->command = $command;
        $this->command3 = $command3;
        $this->cacheKeyTables = $cacheKeyTables;
        $this->cacheKeyColumns = $cacheKeyColumns;
    }

    public function handle()
    {
        $password = $this->db->password;

        // Run the commands and fetch data
        $output = $this->get_db_data($this->command, $password);
        $output3 = $this->get_db_data($this->command3, $password);

        // Cache the results
        Cache::forever($this->cacheKeyTables, $output);
        Cache::forever($this->cacheKeyColumns, $output3);
    }

    public function get_db_data($command,$password){
        $pipes = [];
        $descriptorspec = [
            0 => ['pipe', 'r'],  // stdin (input)
            1 => ['pipe', 'w'],  // stdout (output)
            2 => ['pipe', 'w'],  // stderr (error)
         
        ];
        $process = proc_open($command, $descriptorspec, $pipes);
        
        if (is_resource($process)) {
            // Write the password to the stdin
            fwrite($pipes[0], $password . PHP_EOL);
            fclose($pipes[0]);
     
        
            // Read the output
            $output = stream_get_contents($pipes[1]);
        
            fclose($pipes[1]);
        
            // Read the error (if any)
            $error = stream_get_contents($pipes[2]);
            fclose($pipes[2]);
        
            // Close the process
            $return_value = proc_close($process);
        
            // Print the output
    
           
        }  
        return  $output;
    }
}
