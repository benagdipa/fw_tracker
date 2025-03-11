<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\WNTD;
use Faker\Factory as Faker;

class WNTDSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing data to avoid duplicates
        DB::table('wntd')->truncate();
        
        $faker = Faker::create();
        
        // Sample data from screenshot without traffic_profile
        $wntdData = [
            [
                'loc_id' => 'LOC00001',
                'wntd' => 'NTD00004',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 148.1626,
                'lat' => -20.0194,
                'site_name' => 'Merinda',
                'home_cell' => '4BWE-51-0'
            ],
            [
                'loc_id' => 'LOC00005',
                'wntd' => 'NTD00000',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 147.1223,
                'lat' => -37.9882,
                'site_name' => 'Stratford',
                'home_cell' => '3STR-51-1'
            ],
            [
                'loc_id' => 'LOC00012',
                'wntd' => 'NTD00003',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 146.4247,
                'lat' => -38.3193,
                'site_name' => 'Jeeralang Junction',
                'home_cell' => '3CHH-51-0'
            ],
            [
                'loc_id' => 'LOC00013',
                'wntd' => 'NTD00003',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00019',
                'bw_profile' => 'FW Home',
                'lon' => 148.2721,
                'lat' => -41.5072,
                'site_name' => 'Scamander',
                'home_cell' => '7SCA-51-0'
            ],
            [
                'loc_id' => 'LOC00012',
                'wntd' => 'NTD00004',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 149.8,
                'lat' => -25.6358,
                'site_name' => 'Taroom',
                'home_cell' => '4MLE-51-2'
            ],
            [
                'loc_id' => 'LOC00008',
                'wntd' => 'NTD00004',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 149.0371,
                'lat' => -33.4367,
                'site_name' => 'Forest Glen',
                'home_cell' => '2FOG-51-1'
            ],
            [
                'loc_id' => 'LOC00015',
                'wntd' => 'NTD00003',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00019',
                'bw_profile' => 'FW Home',
                'lon' => 147.5233,
                'lat' => -42.7856,
                'site_name' => 'Sorell',
                'home_cell' => '7SOR-51-0'
            ],
            [
                'loc_id' => 'LOC00018',
                'wntd' => 'NTD00004',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Superior',
                'lon' => 150.1428,
                'lat' => -35.7822,
                'site_name' => 'Mogo',
                'home_cell' => '2BTM-51-0'
            ],
            [
                'loc_id' => 'LOC00017',
                'wntd' => 'NTD00004',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00007',
                'bw_profile' => 'FW Home',
                'lon' => 150.0701,
                'lat' => -36.3737,
                'site_name' => 'Wallaga Lake',
                'home_cell' => '2BMG-51-0'
            ],
            [
                'loc_id' => 'LOC00004',
                'wntd' => 'NTD00004',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Superior',
                'lon' => 153.4693,
                'lat' => -28.4411,
                'site_name' => 'Burringbar',
                'home_cell' => '2MWB-51-1'
            ],
            [
                'loc_id' => 'LOC00007',
                'wntd' => 'NTD00002',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00012',
                'bw_profile' => 'FW Home',
                'lon' => 152.8522,
                'lat' => -26.3824,
                'site_name' => 'Pomona Surrounds',
                'home_cell' => '4POM-51-1'
            ],
            [
                'loc_id' => 'LOC00007',
                'wntd' => 'NTD00004',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 145.9021,
                'lat' => -38.1738,
                'site_name' => 'Camp Hill',
                'home_cell' => '3WGU-51-0'
            ],
            [
                'loc_id' => 'LOC00001',
                'wntd' => 'NTD00001',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 149.7178,
                'lat' => -33.5135,
                'site_name' => 'O\'Connell',
                'home_cell' => '2BTH-51-1'
            ],
            [
                'loc_id' => 'LOC00007',
                'wntd' => 'NTD00005',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 146.7949,
                'lat' => -41.527,
                'site_name' => 'Westbury',
                'home_cell' => '7DEL-51-0'
            ],
            [
                'loc_id' => 'LOC10008',
                'wntd' => 'NTD00004',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00016',
                'bw_profile' => 'FW Home',
                'lon' => 151.3975,
                'lat' => -33.2244,
                'site_name' => 'Jilliby',
                'home_cell' => '2WYO-51-1'
            ],
            [
                'loc_id' => 'LOC00003',
                'wntd' => 'NTD00003',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00014',
                'bw_profile' => 'FW Home',
                'lon' => 149.6575,
                'lat' => -32.3859,
                'site_name' => 'Yarrawonga',
                'home_cell' => '2GUL-51-1'
            ],
            [
                'loc_id' => 'LOC00006',
                'wntd' => 'NTD00004',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00009',
                'bw_profile' => 'FW Home',
                'lon' => 151.077,
                'lat' => -33.6113,
                'site_name' => 'Galston East',
                'home_cell' => '2ROU-51-2'
            ],
            [
                'loc_id' => 'LOC00003',
                'wntd' => 'NTD00003',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00018',
                'bw_profile' => 'FW Superior',
                'lon' => 146.3091,
                'lat' => -41.3972,
                'site_name' => 'Paradise',
                'home_cell' => '7RAO-51-0'
            ],
            [
                'loc_id' => 'LOC00012',
                'wntd' => 'NTD00003',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 142.35,
                'lat' => -37.8502,
                'site_name' => 'Dunkeld',
                'home_cell' => '3HMO-51-0'
            ],
            [
                'loc_id' => 'LOC10005',
                'wntd' => 'NTD00003',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 150.5575,
                'lat' => -35.9159,
                'site_name' => 'Moruya Town',
                'home_cell' => '2MYA-51-0'
            ],
            [
                'loc_id' => 'LOC00017',
                'wntd' => 'NTD00003',
                'imsi' => '5.06E+14',
                'version' => 'V3',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Home',
                'lon' => 150.5767,
                'lat' => -24.4189,
                'site_name' => 'Biloela',
                'home_cell' => '4BIL-51-0'
            ],
            [
                'loc_id' => 'LOC00009',
                'wntd' => 'NTD00003',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Superior',
                'lon' => 152.8758,
                'lat' => -28.1136,
                'site_name' => 'Rathdowney',
                'home_cell' => '4BDS-51-0'
            ],
            [
                'loc_id' => 'LOC00018',
                'wntd' => 'NTD00004',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00020',
                'bw_profile' => 'FW Superior',
                'lon' => 148.6013,
                'lat' => -36.4372,
                'site_name' => 'Jindabyne South',
                'home_cell' => '2JNB-51-0'
            ],
            [
                'loc_id' => 'LOC00004',
                'wntd' => 'NTD00005',
                'imsi' => '5.06E+14',
                'version' => 'V4',
                'avc' => 'AVC00019',
                'bw_profile' => 'FW Home',
                'lon' => 148.8773,
                'lat' => -36.4393,
                'site_name' => 'Dalgety',
                'home_cell' => '2COM-51-1'
            ],
        ];
        
        // Additional fields to randomize
        $statuses = ['Active', 'Pending', 'Complete', 'In Progress', 'Maintenance'];
        $solutionTypes = ['Standard', 'Premium', 'Custom', 'Temporary', 'Permanent'];
        
        // Insert data with additional fields
        $count = 1;
        foreach ($wntdData as $index => $data) {
            // Ensure unique WNTD values by appending an increment to duplicates
            $data['wntd'] = $data['wntd'] . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
            
            // Ensure unique loc_id values by appending an increment to duplicates
            $data['loc_id'] = $data['loc_id'] . '-' . str_pad($count++, 3, '0', STR_PAD_LEFT);

            // Generate random dates, handling nulls safely
            $startDate = $faker->dateTimeBetween('-2 years', '-6 months');
            $endDateObj = $faker->optional(0.7)->dateTimeBetween('-3 months', '+1 year');
            $endDate = $endDateObj ? $endDateObj->format('Y-m-d') : null;
            
            // Random text content with safe null handling 
            $remarks = $faker->optional(0.8)->sentence(4);
            
            // Random artifacts array with safe handling
            $artifactsData = $faker->optional(0.4)->randomElements(
                ['config.json', 'setup.log', 'specs.pdf', 'report.docx'], 
                $faker->numberBetween(1, 3)
            );
            
            // Add common fields for all records
            $record = array_merge($data, [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate,
                'remarks' => $remarks,
                'solution_type' => $faker->randomElement($solutionTypes),
                'status' => $faker->randomElement($statuses),
                'home_pci' => $faker->numberBetween(1, 504),
                'artefacts' => $artifactsData,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            WNTD::create($record);
        }
        
        $this->command->info('WNTD sample data has been seeded successfully!');
    }
} 