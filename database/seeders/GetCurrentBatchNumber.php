<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GetCurrentBatchNumber extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $maxBatch = DB::table('migrations')->max('batch');
        echo $maxBatch ?? 0;
    }
}