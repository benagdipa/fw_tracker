<?php


namespace App\Services;

use Illuminate\Support\Facades\Http;

class TrinoHttpService
{
    protected $server;
    protected $username;
    protected $password;

    public function __construct()
    {
        $this->server = "localhost"; // e.g., http://your-trino-server:8080
        $this->username = "uname";
        $this->password = "pass";
    }

    public function runQuery($sqlQuery)
    {
        $response = Http::withBasicAuth($this->username, $this->password)
            ->post("{$this->server}/v1/statement", [
                'query' => $sqlQuery,
            ]);

        if ($response->successful()) {
            return $response->json();
        } else {
            return ['error' => 'Query execution failed', 'details' => $response->body()];
        }
    }
}
