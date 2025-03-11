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
        // First create the table if it doesn't exist
        if (!Schema::hasTable('column_options')) {
            Schema::create('column_options', function (Blueprint $table) {
                $table->id();
                $table->string('type');
                $table->string('key');
                $table->string('value')->nullable();
                $table->timestamps();
            });
        }

        // Then add the names column if it doesn't exist
        if (Schema::hasTable('column_options') && !Schema::hasColumn('column_options', 'names')) {
            Schema::table('column_options', function (Blueprint $table) {
                $table->string('names')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only drop the names column if we're rolling back
        if (Schema::hasTable('column_options') && Schema::hasColumn('column_options', 'names')) {
            Schema::table('column_options', function (Blueprint $table) {
                $table->dropColumn('names');
            });
        }
    }
};
