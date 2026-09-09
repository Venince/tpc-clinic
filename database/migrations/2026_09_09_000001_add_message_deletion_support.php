<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Per-user "hide this conversation from my list" flag.
        // NULL = visible to that participant, timestamp = they deleted it (only for them).
        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->timestamp('deleted_at')->nullable()->after('is_archived');
        });

        // Tracks which users have chosen "Delete for me" on an individual message.
        // "Delete for everyone" instead uses the messages table's own soft-delete
        // (messages.deleted_at), since that hides the message from all participants.
        Schema::create('message_deletions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['message_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_deletions');

        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->dropColumn('deleted_at');
        });
    }
};