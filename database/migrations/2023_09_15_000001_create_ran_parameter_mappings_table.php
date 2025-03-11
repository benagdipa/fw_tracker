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
        Schema::create('ran_parameter_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('parameter_id')->nullable();
            $table->string('vendor_a')->nullable()->comment('First vendor parameter name/value');
            $table->string('vendor_b')->nullable()->comment('Second vendor parameter name/value');
            $table->string('vendor_c')->nullable()->comment('Third vendor parameter name/value');
            $table->string('vendor_d')->nullable()->comment('Fourth vendor parameter name/value');
            $table->string('vendor_e')->nullable()->comment('Fifth vendor parameter name/value');
            $table->string('parameter_group')->nullable()->comment('Grouping for parameters');
            $table->string('parameter_category')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sequence')->nullable();
            $table->string('value_type')->nullable()->comment('Data type of the parameter');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Indexing for better performance
            $table->index('parameter_id');
            $table->index('parameter_group');
            $table->index('parameter_category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ran_parameter_mappings');
    }
}; 