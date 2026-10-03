<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->boolean('is_pinned')->default(false)->after('is_published')->index();
        });

        // TEXT caps at ~64 KB; MEDIUMTEXT allows ~16 MB, plenty for long lists.
        Schema::table('announcements', function (Blueprint $table) {
            $table->mediumText('content')->change();
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropIndex(['is_pinned']);
            $table->dropColumn('is_pinned');
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->text('content')->change();
        });
    }
};