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
        Schema::create('attributes', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('entity_id');
            $table->string('name');
            $table->string('slug');
            $table->string('type');
            $table->boolean('sortable');
            $table->integer('position');
            $table->boolean('editable');
            $table->string('input_type')->nullable();
            $table->json('input_options')->nullable();
            $table->boolean('hidden')->default(false);
            $table->string('alternative_name')->nullable();
            $table->integer('user_id');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attributes');
    }
};
