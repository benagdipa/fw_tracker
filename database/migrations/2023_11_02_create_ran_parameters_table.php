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
        Schema::create('ran_parameters', function (Blueprint $table) {
            $table->id();
            $table->string('parameter_id')->nullable();
            $table->string('parameter_name')->nullable();
            $table->string('parameter_value')->nullable();
            $table->text('description')->nullable();
            $table->string('domain')->nullable();
            $table->string('data_type')->nullable();
            $table->string('mo_reference')->nullable();
            $table->string('default_value')->nullable();
            $table->string('category')->nullable();
            $table->string('technology')->nullable();
            $table->string('vendor')->nullable();
            $table->string('applicability')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
            
            // Add index for faster queries
            $table->index('parameter_id');
            $table->index('parameter_name');
            $table->index('category');
            $table->index('technology');
            $table->index('vendor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ran_parameters');
    }
}; 