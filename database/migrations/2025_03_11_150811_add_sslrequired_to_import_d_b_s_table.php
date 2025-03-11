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
        Schema::table('import_d_b_s', function (Blueprint $table) {
            // Check if the column already exists before trying to add it
            if (!Schema::hasColumn('import_d_b_s', 'sslrequired')) {
                $table->boolean('sslrequired')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('import_d_b_s', function (Blueprint $table) {
            if (Schema::hasColumn('import_d_b_s', 'sslrequired')) {
                $table->dropColumn('sslrequired');
            }
        });
    }
};
