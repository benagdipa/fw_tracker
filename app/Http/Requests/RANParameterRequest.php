<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RANParameterRequest extends FormRequest
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
            'parameter_id' => 'sometimes|string|max:255',
            'parameter_name' => 'required|string|max:255',
            'parameter_value' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'domain' => 'sometimes|string|max:255',
            'data_type' => 'sometimes|string|max:50',
            'mo_reference' => 'sometimes|string|max:255',
            'default_value' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:100',
            'technology' => 'sometimes|string|max:50',
            'vendor' => 'sometimes|string|max:100',
            'applicability' => 'sometimes|string|max:255',
            'status' => 'sometimes|string|max:50',
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
            'parameter_name.required' => 'The parameter name is required.',
            'parameter_name.max' => 'The parameter name must not exceed 255 characters.',
            'data_type.max' => 'The data type must not exceed 50 characters.',
        ];
    }
} 