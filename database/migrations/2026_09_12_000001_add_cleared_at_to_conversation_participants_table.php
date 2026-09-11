<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Per-user watermark: the moment this user last deleted the
        // conversation. Unlike `deleted_at` (which gets cleared back to null
        // the moment the conversation is "revived" by a new message), this
        // timestamp is never reset. Messages created before it stay hidden
        // for this user forever, even after the conversation reappears in
        // their inbox — this is what "delete conversation" should really do.
        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->timestamp('cleared_at')->nullable()->after('deleted_at');
        });

        // Subject is going away from the compose UI (Messenger-style — just
        // pick a person and type). Make the column optional so old rows and
        // any remaining reads don't break; new conversations simply won't
        // set it.
        Schema::table('conversations', function (Blueprint $table) {
            $table->string('subject')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->dropColumn('cleared_at');
        });

        // Not reverting `subject` back to NOT NULL on rollback — there may
        // be rows created after this migration with a null subject, and
        // reverting would break them. Handle that manually if you ever need
        // to roll all the way back.
    }
};