<?php

namespace App\Services;

use App\Models\WNTD;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class WNTDImportService extends BaseImportService
{
    public function __construct()
    {
        $this->tableName = 'wntd';
        $this->historyTable = 'wntd_history';
        $this->requiredFields = ['site_name', 'wntd', 'imsi'];
        $this->validationRules = [
            'site_name' => 'required|string|max:255',
            'loc_id' => 'nullable|string|max:50',
            'wntd' => 'required|string|max:50',
            'imsi' => 'required|string|max:50',
            'version' => 'nullable|string|max:50',
            'avc' => 'nullable|string|max:255',
            'bw_profile' => 'nullable|string|max:255',
            'lon' => 'nullable|numeric',
            'lat' => 'nullable|numeric',
            'home_cell' => 'nullable|string|max:50',
            'home_pci' => 'nullable|string|max:50',
            'remarks' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'solution_type' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:50',
            'artefacts' => 'nullable|array'
        ];
    }

    protected function processRow($row)
    {
        // Create WNTD record
        $wntd = WNTD::create($row);

        // Track creation in history
        foreach ($row as $field => $value) {
            if (!in_array($field, ['created_at', 'updated_at'])) {
                DB::table($this->historyTable)->insert([
                    'wntd_id' => $wntd->id,
                    'field_name' => $field,
                    'old_value' => null,
                    'new_value' => $value,
                    'user_id' => Auth::id(),
                    'change_type' => 'create',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        return $wntd;
    }
} 