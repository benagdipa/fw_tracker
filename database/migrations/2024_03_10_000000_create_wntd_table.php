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
        Schema::create('wntd', function (Blueprint $table) {
            $table->id();
            
            // Site Information
            $table->string('site_name');
            $table->string('loc_id')->unique();
            $table->string('wntd')->unique();
            
            // Technical Details
            $table->string('imsi')->nullable();
            $table->string('version')->nullable();
            $table->string('avc')->nullable();
            $table->string('bw_profile')->nullable();
            
            // Location Information
            $table->decimal('lon', 10, 6)->nullable();
            $table->decimal('lat', 10, 6)->nullable();
            
            // Cell Information
            $table->string('home_cell')->nullable();
            $table->string('home_pci')->nullable();
            
            // Tracking Information
            $table->text('remarks')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('solution_type')->nullable();
            $table->string('status')->nullable();
            $table->json('artefacts')->nullable();
            
            // Timestamps and Soft Delete
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for better performance
            $table->index('site_name');
            $table->index('status');
            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wntd');
    }
}; 