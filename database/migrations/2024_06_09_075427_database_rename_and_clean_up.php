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
        Schema::dropIfExists('replies');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('issues');
        Schema::dropIfExists('locations');

        if (Schema::hasTable('sites')) {
            Schema::rename('sites', 'locations');

        }
        if (Schema::hasTable('site_areas')) {
            Schema::rename('site_areas', 'sites');
        }

        if (Schema::hasTable('field_trackings')) {
            Schema::rename('field_trackings', 'sites_trackings');
        }
        if (Schema::hasTable('loc_trackings')) {
            Schema::rename('loc_trackings', 'location_trackings');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('sites')) {
            Schema::rename('sites', 'site_areas');
        }

        if (Schema::hasTable('locations')) {
            Schema::rename('locations', 'sites');
        }

        if (Schema::hasTable('sites_trackings')) {
            Schema::rename('sites_trackings', 'field_trackings');
        }
        if (Schema::hasTable('location_trackings')) {
            Schema::rename('location_trackings', 'loc_trackings');
        }
    }
};
