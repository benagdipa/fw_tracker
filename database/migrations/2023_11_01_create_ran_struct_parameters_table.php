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
        Schema::create('ran_struct_parameters', function (Blueprint $table) {
            $table->id();
            $table->string('model')->nullable();
            $table->string('mo_class_name')->nullable();
            $table->string('parameter_name')->nullable();
            $table->integer('seq')->nullable();
            $table->text('parameter_description')->nullable();
            $table->string('data_type')->nullable();
            $table->string('range')->nullable();
            $table->string('def')->nullable(); // Default value
            $table->boolean('mul')->default(false); // Multiple
            $table->string('unit')->nullable();
            $table->string('rest')->nullable(); // Restriction
            $table->string('read')->nullable();
            $table->string('restr')->nullable();
            $table->string('manc')->nullable();
            $table->string('pers')->nullable();
            $table->string('syst')->nullable();
            $table->string('change')->nullable();
            $table->string('dist')->nullable();
            $table->text('dependencies')->nullable();
            $table->string('dep')->nullable();
            $table->text('obs')->nullable(); // Observation
            $table->string('prec')->nullable(); // Precision
            $table->timestamps();
            
            // Add indexes for faster queries
            $table->index('model');
            $table->index('mo_class_name');
            $table->index('parameter_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ran_struct_parameters');
    }
}; 