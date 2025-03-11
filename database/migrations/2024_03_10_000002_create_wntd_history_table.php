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
        Schema::create('wntd_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('wntd_id');
            $table->string('field_name', 50);
            
            // Use JSON/JSONB type for PostgreSQL compatibility
            if (DB::connection()->getDriverName() === 'pgsql') {
                $table->jsonb('old_value')->nullable();
                $table->jsonb('new_value')->nullable();
            } else {
                $table->text('old_value')->nullable();
                $table->text('new_value')->nullable();
            }
            
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('change_type', 20)->comment('update, create, delete');
            $table->timestamps();
            
            // Add foreign key relationship
            $table->foreign('wntd_id')
                  ->references('id')
                  ->on('wntd')
                  ->onDelete('cascade');
            
            // Add index for faster queries
            $table->index(['wntd_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wntd_history');
    }
}; 