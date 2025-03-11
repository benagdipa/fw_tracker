<?php

namespace App\Observers;

use App\Models\RANParameter;
use App\Models\RANParameterHistory;
use Illuminate\Support\Facades\Auth;

class RANParameterObserver
{
    /**
     * Handle the RANParameter "created" event.
     */
    public function created(RANParameter $parameter): void
    {
        foreach ($parameter->getAttributes() as $field => $value) {
            if (!in_array($field, ['created_at', 'updated_at', 'id'])) {
                RANParameterHistory::create([
                    'parameter_id' => $parameter->id,
                    'field_name' => $field,
                    'old_value' => null,
                    'new_value' => $value,
                    'user_id' => Auth::id(),
                    'change_type' => 'create'
                ]);
            }
        }
    }

    /**
     * Handle the RANParameter "updated" event.
     */
    public function updated(RANParameter $parameter): void
    {
        $changes = $parameter->getDirty();
        foreach ($changes as $field => $newValue) {
            if (!in_array($field, ['created_at', 'updated_at'])) {
                RANParameterHistory::create([
                    'parameter_id' => $parameter->id,
                    'field_name' => $field,
                    'old_value' => $parameter->getOriginal($field),
                    'new_value' => $newValue,
                    'user_id' => Auth::id(),
                    'change_type' => 'update'
                ]);
            }
        }
    }

    /**
     * Handle the RANParameter "deleted" event.
     */
    public function deleted(RANParameter $parameter): void
    {
        foreach ($parameter->getAttributes() as $field => $value) {
            if (!in_array($field, ['created_at', 'updated_at', 'id'])) {
                RANParameterHistory::create([
                    'parameter_id' => $parameter->id,
                    'field_name' => $field,
                    'old_value' => $value,
                    'new_value' => null,
                    'user_id' => Auth::id(),
                    'change_type' => 'delete'
                ]);
            }
        }
    }
} 