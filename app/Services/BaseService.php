<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Exception;

abstract class BaseService
{
    protected $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * Begin a database transaction
     */
    protected function beginTransaction()
    {
        DB::beginTransaction();
    }

    /**
     * Commit a database transaction
     */
    protected function commit()
    {
        DB::commit();
    }

    /**
     * Rollback a database transaction
     */
    protected function rollback()
    {
        DB::rollBack();
    }

    /**
     * Execute a callback within a transaction
     *
     * @param callable $callback
     * @return mixed
     * @throws Exception
     */
    protected function transaction(callable $callback)
    {
        try {
            $this->beginTransaction();
            $result = $callback();
            $this->commit();
            return $result;
        } catch (Exception $e) {
            $this->rollback();
            throw $e;
        }
    }

    /**
     * Create a new record
     *
     * @param array $data
     * @return Model
     */
    public function create(array $data)
    {
        return $this->transaction(function () use ($data) {
            return $this->model->create($data);
        });
    }

    /**
     * Update an existing record
     *
     * @param Model $model
     * @param array $data
     * @return bool
     */
    public function update($model, array $data)
    {
        return $this->transaction(function () use ($model, $data) {
            return $model->update($data);
        });
    }

    /**
     * Delete a record
     *
     * @param Model $model
     * @return bool
     */
    public function delete($model)
    {
        return $this->transaction(function () use ($model) {
            return $model->delete();
        });
    }
} 