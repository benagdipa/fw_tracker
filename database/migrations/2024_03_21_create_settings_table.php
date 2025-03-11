<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('site_name');
            $table->text('site_description')->nullable();
            $table->boolean('maintenance_mode')->default(false);
            $table->boolean('email_notifications')->default(true);
            $table->integer('api_rate_limit')->default(60);
            $table->enum('backup_frequency', ['hourly', 'daily', 'weekly', 'monthly'])->default('daily');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('settings');
    }
}; 