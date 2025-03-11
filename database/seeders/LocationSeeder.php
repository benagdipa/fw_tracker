<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;


class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('locations')->insert([
            'loc_id'=>'bbc16',
            'wntd'=>'cbc16',
            'imsi'=>'dbc16',
            'version'=>'ebc16',
            'avc'=>'fbc16',
            'bw_profile'=>'gbc161',
            'lon'=>'hbc161',
            'lat'=>'ibc161',
            'site_name'=>'gaga16',
            'home_cell'=>'ttata16',
            'home_pci'=>'tgw16',
            'traffic_profile'=>'tes16t_id16',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }   
    
}
