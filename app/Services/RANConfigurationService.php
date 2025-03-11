<?php

namespace App\Services;

use App\Models\RANParameter;
use App\Models\RANStructParameter;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Exception;

class RANConfigurationService extends BaseService
{
    protected $structParameterModel;

    public function __construct(RANParameter $model, RANStructParameter $structParameterModel)
    {
        parent::__construct($model);
        $this->structParameterModel = $structParameterModel;
    }

    /**
     * Import RAN parameters from Excel data
     *
     * @param array $data
     * @return array
     */
    public function importFromExcel(array $data): array
    {
        return $this->transaction(function () use ($data) {
            $imported = 0;
            $errors = [];

            foreach ($data as $row) {
                try {
                    $this->validateParameterData($row);
                    $this->model->create($row);
                    $imported++;
                } catch (Exception $e) {
                    $errors[] = "Row " . ($imported + 1) . ": " . $e->getMessage();
                    Log::error('RAN Parameter import error', [
                        'row' => $row,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            return [
                'imported' => $imported,
                'errors' => $errors
            ];
        });
    }

    /**
     * Validate parameter data
     *
     * @param array $data
     * @throws Exception
     */
    protected function validateParameterData(array $data): void
    {
        $required = ['name', 'type', 'value'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                throw new Exception("Missing required field: {$field}");
            }
        }
    }

    /**
     * Update a RAN parameter
     *
     * @param int $id
     * @param array $data
     * @return RANParameter
     */
    public function updateParameter(int $id, array $data)
    {
        return $this->transaction(function () use ($id, $data) {
            $parameter = $this->model->findOrFail($id);
            
            // Create history record before update
            $parameter->history()->create([
                'old_value' => $parameter->value,
                'new_value' => $data['value'],
                'changed_by' => auth()->id()
            ]);

            $parameter->update($data);
            return $parameter;
        });
    }

    /**
     * Get all parameters with their structure
     *
     * @return Collection
     */
    public function getAllParametersWithStructure(): Collection
    {
        return $this->model->with('structure')->get();
    }

    /**
     * Delete a parameter and its related data
     *
     * @param int $id
     * @return bool
     */
    public function deleteParameter(int $id): bool
    {
        return $this->transaction(function () use ($id) {
            $parameter = $this->model->findOrFail($id);
            
            // Delete related history
            $parameter->history()->delete();
            
            // Delete the parameter
            return $parameter->delete();
        });
    }

    /**
     * Export parameters to array
     *
     * @return array
     */
    public function exportToArray(): array
    {
        return $this->model->with(['structure', 'history'])
            ->get()
            ->map(function ($parameter) {
                return [
                    'name' => $parameter->name,
                    'type' => $parameter->type,
                    'value' => $parameter->value,
                    'structure' => $parameter->structure?->name ?? 'N/A',
                    'last_modified' => $parameter->updated_at->format('Y-m-d H:i:s'),
                    'history_count' => $parameter->history->count()
                ];
            })
            ->toArray();
    }
} 