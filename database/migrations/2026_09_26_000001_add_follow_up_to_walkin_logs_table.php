<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('walkin_logs', function (Blueprint $table) {
            $table->date('follow_up_date')->nullable()->after('notes');
            $table->text('follow_up_notes')->nullable()->after('follow_up_date');
            // 'scheduled' | 'completed' | 'cancelled'
            $table->string('follow_up_status')->nullable()->after('follow_up_notes');
            $table->foreignId('follow_up_scheduled_by')->nullable()->after('follow_up_status')
                ->constrained('users')->nullOnDelete();
            // Guards against the daily reminder command re-sending the same reminder twice.
            $table->timestamp('follow_up_reminder_day_before_sent_at')->nullable()->after('follow_up_scheduled_by');
            $table->timestamp('follow_up_reminder_day_of_sent_at')->nullable()->after('follow_up_reminder_day_before_sent_at');

            $table->index(['follow_up_date', 'follow_up_status']);
        });
    }

    public function down(): void
    {
        Schema::table('walkin_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('follow_up_scheduled_by');
            $table->dropColumn([
                'follow_up_date',
                'follow_up_notes',
                'follow_up_status',
                'follow_up_reminder_day_before_sent_at',
                'follow_up_reminder_day_of_sent_at',
            ]);
        });
    }
};