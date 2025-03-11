<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'end_date', 'solution_type', 'status', 'remarks', 'artifacts']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->string('start_date')->nullable();
            $table->string('end_date')->nullable();
            $table->string('solution_type')->nullable();
            $table->string('status')->nullable();
            $table->string('remarks')->nullable();
            $table->json('artifacts')->nullable();
        });
    }
};
