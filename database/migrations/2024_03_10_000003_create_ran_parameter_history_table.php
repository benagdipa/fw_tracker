<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ran_parameter_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parameter_id');
            $table->string('field_name', 50);
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('change_type', 20)->comment('update, create, delete');
            $table->timestamps();
            
            // Add foreign key relationship
            $table->foreign('parameter_id')
                  ->references('id')
                  ->on('ran_parameters')
                  ->onDelete('cascade');
            
            // Add index for faster queries
            $table->index(['parameter_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ran_parameter_history');
    }
}; 