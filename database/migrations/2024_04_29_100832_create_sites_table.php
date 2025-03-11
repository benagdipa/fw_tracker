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
        Schema::create('sites', function (Blueprint $table) {
            $table->id();
            $table->string('loc_id')->nullable();
            $table->string('wntd')->nullable();
            $table->string('imsi')->nullable();
            $table->string('version')->nullable();
            $table->string('avc')->nullable();
            $table->string('bw_profile')->nullable();
            $table->string('lon')->nullable();
            $table->string('lat')->nullable();
            $table->string('site_name')->nullable();
            $table->string('home_cell')->nullable();
            $table->string('home_pci')->nullable();
            $table->string('traffic_profile')->nullable();
            $table->string('start_date')->nullable();
            $table->string('end_date')->nullable();
            $table->string('solution_type')->nullable();
            $table->string('status')->nullable();
            $table->string('remarks')->nullable();
            $table->json('artifacts')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
