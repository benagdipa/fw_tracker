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
        Schema::create('implementations', function (Blueprint $table) {
            $table->id();
            $table->string('category')->nullable();
            $table->string('siteName')->nullable();
            $table->string('eNB_gNB')->nullable();
            $table->string('implementor')->nullable();
            $table->string('status')->nullable();
            $table->string('comments')->nullable();
            $table->string('enm_scripts_path')->nullable();
            $table->string('sp_scripts_path')->nullable();
            $table->string('CRQ')->nullable();
            $table->string('Date')->nullable();      
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('implementations');
    }
};
