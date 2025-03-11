<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Support\Arr;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\JsonResponse;

class ValidationException extends Exception
{
    /**
     * The validator instance.
     *
     * @var \Illuminate\Contracts\Validation\Validator
     */
    public $validator;

    /**
     * The recommended response to send to the client.
     *
     * @var \Illuminate\Http\JsonResponse
     */
    public $response;

    /**
     * The error bag for the validation exception.
     *
     * @var string
     */
    public $errorBag;

    /**
     * Create a new exception instance.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @param  \Illuminate\Http\JsonResponse|null  $response
     * @param  string  $errorBag
     * @return void
     */
    public function __construct(Validator $validator, $response = null, $errorBag = 'default')
    {
        parent::__construct('The given data was invalid.');

        $this->validator = $validator;
        $this->response = $response;
        $this->errorBag = $errorBag;
    }

    /**
     * Create a new validation exception from a validator.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @param  string  $errorBag
     * @return static
     */
    public static function fromValidator(Validator $validator, $errorBag = 'default')
    {
        return new static($validator, null, $errorBag);
    }

    /**
     * Get all of the validation error messages.
     *
     * @return array
     */
    public function errors()
    {
        return $this->validator->errors()->messages();
    }

    /**
     * Get the first error message.
     *
     * @param  string|null  $field
     * @return string
     */
    public function getErrorMessage($field = null)
    {
        if ($field) {
            return Arr::first(Arr::get($this->errors(), $field, [])) ?: parent::getMessage();
        }

        return collect($this->errors())->flatten()->first() ?: parent::getMessage();
    }

    /**
     * Set the HTTP response to send to the client.
     *
     * @param  \Illuminate\Http\JsonResponse  $response
     * @return $this
     */
    public function setResponse(JsonResponse $response)
    {
        $this->response = $response;

        return $this;
    }

    /**
     * Get the response instance.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getResponse()
    {
        if (! $this->response) {
            $this->response = new JsonResponse([
                'message' => $this->getErrorMessage(),
                'errors' => $this->errors(),
                'success' => false,
                'status' => 'validation_error',
            ], 422);
        }

        return $this->response;
    }
} 