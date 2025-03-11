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
            $table->string('type')->default('parameter')->after('status'); // 'parameter' or 'struct'
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ran_parameters', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
}; 