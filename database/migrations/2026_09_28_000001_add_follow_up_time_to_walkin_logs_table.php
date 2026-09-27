<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('walkin_logs', function (Blueprint $table) {
            $table->time('follow_up_time')->nullable()->after('follow_up_date');
        });
    }

    public function down(): void
    {
        Schema::table('walkin_logs', function (Blueprint $table) {
            $table->dropColumn('follow_up_time');
        });
    }
};