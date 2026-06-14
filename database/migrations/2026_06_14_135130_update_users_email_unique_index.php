<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the existing unique index
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_email_unique');
        });

        // Add a partial unique index — only enforces uniqueness on non-deleted rows
        DB::statement('CREATE UNIQUE INDEX users_email_unique ON users (email, deleted_at)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX users_email_unique ON users');

        Schema::table('users', function (Blueprint $table) {
            $table->unique('email', 'users_email_unique');
        });
    }
};