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
        Schema::table('implementations', function (Blueprint $table) {
            $table->renameColumn('siteName', 'site_name');
            $table->renameColumn('eNB_gNB', 'cell_name');
            $table->renameColumn('Date', 'start_date');
            $table->string('end_date')->nullable()->after('start_date');
            $table->text('notes')->nullable()->after('status');
            $table->string('address')->nullable()->after('notes');
            $table->decimal('lat', 10, 6)->nullable()->after('address');
            $table->decimal('lng', 10, 6)->nullable()->after('lat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('implementations', function (Blueprint $table) {
            $table->dropColumn(['end_date', 'notes', 'address', 'lat', 'lng']);
            $table->renameColumn('site_name', 'siteName');
            $table->renameColumn('cell_name', 'eNB_gNB');
            $table->renameColumn('start_date', 'Date');
        });
    }
};
