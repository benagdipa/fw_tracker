<?php

namespace App\Jobs;

use App\Models\Location;
use App\Models\LocationTracking;
use Illuminate\Support\Facades\Auth;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class ProcessCsvImport implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */

    protected $input, $information;

    public function __construct($input, $information)
    {
        $this->input = $input;
        $this->information = $information;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        foreach ($this->information as $row) {
            // Check if the WNTD record with the given loc_id exists
            $existingWntd = DB::table('wntd')->where('loc_id', $row[$this->input['loc_id']])->first();

            if ($existingWntd) {
                // If found, update the existing record
                DB::table('wntd')->where('id', $existingWntd->id)->update([
                    'wntd' => $row[$this->input['wntd']],
                    'imsi' => $row[$this->input['imsi']],
                    'version' => $row[$this->input['version']],
                    'avc' => $row[$this->input['avc']],
                    'bw_profile' => $row[$this->input['bw_profile']],
                    'lon' => $row[$this->input['lon']],
                    'lat' => $row[$this->input['lat']],
                    'site_name' => $row[$this->input['site_name']],
                    'home_cell' => $row[$this->input['home_cell']],
                    'home_pci' => $row[$this->input['home_pci']],
                    'traffic_profile' => $row[$this->input['traffic_profile']],
                    'remarks' => $row[$this->input['remarks']] ?? '',
                ]);
            } else {
                // If not found, create a new record
                DB::table('wntd')->insert([
                    'loc_id' => $row[$this->input['loc_id']],
                    'wntd' => $row[$this->input['wntd']],
                    'imsi' => $row[$this->input['imsi']],
                    'version' => $row[$this->input['version']],
                    'avc' => $row[$this->input['avc']],
                    'bw_profile' => $row[$this->input['bw_profile']],
                    'lon' => $row[$this->input['lon']],
                    'lat' => $row[$this->input['lat']],
                    'site_name' => $row[$this->input['site_name']],
                    'home_cell' => $row[$this->input['home_cell']],
                    'home_pci' => $row[$this->input['home_pci']] ?? '',
                    'traffic_profile' => $row[$this->input['traffic_profile']],
                    'remarks' => $row[$this->input['remarks']] ?? '',
                ]);
            }
        }
    }
}
