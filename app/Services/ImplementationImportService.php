<?php

namespace App\Services;

use App\Models\Implementation;
use App\Models\ImplementationTracking;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ImplementationImportService extends BaseImportService
{
    public function __construct()
    {
        $this->tableName = 'implementations';
        $this->historyTable = 'implementation_audit_log';
        $this->requiredFields = ['siteName'];
        $this->validationRules = [
            'category' => 'nullable|string|max:100',
            'siteName' => 'required|string|max:255',
            'eNB_gNB' => 'nullable|string|max:50',
            'implementor' => 'nullable|string|max:100',
            'comments' => 'nullable|string',
            'enm_scripts_path' => 'nullable|string|max:255',
            'sp_scripts_path' => 'nullable|string|max:255',
            'CRQ' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:not_started,in_progress,completed,blocked',
            'Date' => 'nullable|date',
            'progress' => 'nullable|integer|min:0|max:100',
            'notes' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id'
        ];
    }

    protected function processRow($row)
    {
        // Create Implementation record
        $implementation = Implementation::create([
            'category' => $row['category'] ?? '',
            'siteName' => $row['siteName'],
            'eNB_gNB' => $row['eNB_gNB'] ?? '',
            'implementor' => $row['implementor'] ?? '',
            'comments' => $row['comments'] ?? '',
            'enm_scripts_path' => $row['enm_scripts_path'] ?? '',
            'sp_scripts_path' => $row['sp_scripts_path'] ?? '',
            'CRQ' => $row['CRQ'] ?? ''
        ]);

        // Save tracking fields
        $trackingFields = ['category', 'status', 'Date', 'progress', 'notes', 'assigned_to'];
        foreach ($trackingFields as $field) {
            if (isset($row[$field]) && $row[$field] !== '') {
                ImplementationTracking::create([
                    'implementation_area_id' => $implementation->id,
                    'user_id' => Auth::id(),
                    'key' => $field,
                    'value' => $row[$field]
                ]);

                // Log to audit table
                DB::table($this->historyTable)->insert([
                    'implementation_id' => $implementation->id,
                    'field_name' => $field,
                    'old_value' => null,
                    'new_value' => $row[$field],
                    'user_id' => Auth::id(),
                    'created_at' => now()
                ]);
            }
        }

        return $implementation;
    }
} 