<?php

namespace App\Console\Commands;

use App\Models\WalkinLog;
use App\Notifications\WalkinFollowUpReminderNotification;
use Illuminate\Console\Command;

class SendWalkinFollowUpReminders extends Command
{
    protected $signature = 'walkin:send-followup-reminders';

    protected $description = 'Notify patients whose walk-in follow-up visit is scheduled for tomorrow or today.';

    public function handle(): int
    {
        $tomorrow = now()->addDay()->toDateString();
        $today    = now()->toDateString();

        $dueTomorrow = WalkinLog::where('follow_up_status', 'scheduled')
            ->whereDate('follow_up_date', $tomorrow)
            ->whereNull('follow_up_reminder_day_before_sent_at')
            ->with('user')
            ->get();

        foreach ($dueTomorrow as $log) {
            $log->user?->notify(new WalkinFollowUpReminderNotification($log, 'day_before'));
            $log->update(['follow_up_reminder_day_before_sent_at' => now()]);
        }

        $dueToday = WalkinLog::where('follow_up_status', 'scheduled')
            ->whereDate('follow_up_date', $today)
            ->whereNull('follow_up_reminder_day_of_sent_at')
            ->with('user')
            ->get();

        foreach ($dueToday as $log) {
            $log->user?->notify(new WalkinFollowUpReminderNotification($log, 'day_of'));
            $log->update(['follow_up_reminder_day_of_sent_at' => now()]);
        }

        $this->info(sprintf(
            'Sent %d day-before and %d day-of follow-up reminders.',
            $dueTomorrow->count(),
            $dueToday->count(),
        ));

        return self::SUCCESS;
    }
}