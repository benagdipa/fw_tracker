<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RANStructParameterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        // Check if user is authenticated and has the right permissions
        return auth()->check() && $this->user() && $this->user()->hasAnyRole(['super-admin', 'admin', 'Editor']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'model' => 'sometimes|string|max:255',
            'mo_class_name' => 'required|string|max:255',
            'parameter_name' => 'required|string|max:255',
            'seq' => 'sometimes|integer',
            'parameter_description' => 'sometimes|string',
            'data_type' => 'sometimes|string|max:50',
            'range' => 'sometimes|string|max:255',
            'def' => 'sometimes|string|max:255',
            'mul' => 'sometimes|boolean',
            'unit' => 'sometimes|string|max:50',
            'rest' => 'sometimes|string|max:255',
            'read' => 'sometimes|string|max:255',
            'restr' => 'sometimes|string|max:255',
            'manc' => 'sometimes|string|max:50',
            'pers' => 'sometimes|string|max:50',
            'syst' => 'sometimes|string|max:50',
            'change' => 'sometimes|string|max:50',
            'dist' => 'sometimes|string|max:50',
            'dependencies' => 'sometimes|string',
            'dep' => 'sometimes|string|max:255',
            'obs' => 'sometimes|string',
            'prec' => 'sometimes|string|max:50',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'mo_class_name.required' => 'The MO class name is required.',
            'parameter_name.required' => 'The parameter name is required.',
            'seq.integer' => 'The sequence must be an integer.',
        ];
    }
} 