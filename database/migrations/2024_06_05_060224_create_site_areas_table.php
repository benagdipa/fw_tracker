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
        Schema::create('site_areas', function (Blueprint $table) {
            $table->id();
            $table->string('site_name')->nullable();
            $table->string('cell_name')->nullable();
            $table->string('lon')->nullable();
            $table->string('lat')->nullable();
            $table->string('bb_type')->nullable();
            $table->string('rru_type')->nullable();
            $table->string('antenna_type')->nullable();
            $table->string('frequency')->nullable();
            $table->string('pci')->nullable();
            $table->string('azimuth')->nullable();
            $table->string('height')->nullable();
            $table->string('last_epo')->nullable();
            $table->string('next_epo')->nullable();
            $table->string('solution_type')->nullable();
            $table->string('start_date')->nullable();
            $table->string('end_date')->nullable();
            $table->string('status')->nullable();
            $table->longText('remarks')->nullable();
            $table->json('artifacts')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_areas');
    }
};
