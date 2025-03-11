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
        Schema::create('implementations_trackings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('implementation_area_id');
            $table->unsignedBigInteger('user_id');
            $table->string('key');
            $table->longText('value');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('implementations_trackings');
    }
};
