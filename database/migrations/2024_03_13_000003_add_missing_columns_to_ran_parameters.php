<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ran_parameters', function (Blueprint $table) {
            // Add missing columns
            if (!Schema::hasColumn('ran_parameters', 'value_range')) {
                $table->string('value_range')->nullable();
            }
            if (!Schema::hasColumn('ran_parameters', 'unit')) {
                $table->string('unit')->nullable();
            }
            if (!Schema::hasColumn('ran_parameters', 'value')) {
                $table->text('value')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ran_parameters', function (Blueprint $table) {
            $table->dropColumn(['value_range', 'unit', 'value']);
        });
    }
}; 