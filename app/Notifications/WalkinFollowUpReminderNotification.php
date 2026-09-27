<?php

namespace App\Notifications;

use App\Models\WalkinLog;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class WalkinFollowUpReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  WalkinLog  $log
     * @param  string  $when  'day_before' | 'day_of'
     */
    public function __construct(public readonly WalkinLog $log, public readonly string $when) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    protected function message(): string
    {
        $date = Carbon::parse($this->log->follow_up_date)->format('M d, Y');
        if ($this->log->follow_up_time) {
            $date .= ' at ' . Carbon::parse($this->log->follow_up_time)->format('g:i A');
        }

        return $this->when === 'day_of'
            ? "Reminder: you have a follow-up clinic visit today ({$date})."
            : "Reminder: you have a follow-up clinic visit tomorrow ({$date}).";
    }

    protected function url(object $notifiable): ?string
    {
        $role = $notifiable->role?->name;

        return match ($role) {
            'student'              => route('student.walkin.index', ['highlight' => $this->log->id]),
            'faculty_staff'        => route('faculty.walkin.index', ['highlight' => $this->log->id]),
            'admin', 'super_admin' => route('admin.walkin.index', ['highlight' => $this->log->id]),
            default                => null,
        };
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'WalkinFollowUpReminderNotification',
            'record_id' => $this->log->id,
            'message'   => $this->message(),
            'when'      => $this->when,
            'url'       => $this->url($notifiable),
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('Upcoming follow-up visit')
            ->icon('/images/tpc-logo.png')
            ->body($this->message())
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 86400]);
    }
}