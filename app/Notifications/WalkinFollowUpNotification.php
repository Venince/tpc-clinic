<?php

namespace App\Notifications;

use App\Models\WalkinLog;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class WalkinFollowUpNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  WalkinLog  $log
     * @param  string  $action  'scheduled' | 'rescheduled' | 'cancelled'
     */
    public function __construct(public readonly WalkinLog $log, public readonly string $action) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    protected function message(): string
    {
        $date = $this->log->follow_up_date
            ? Carbon::parse($this->log->follow_up_date)->format('M d, Y')
            : 'a future date';

        if ($this->log->follow_up_time) {
            $date .= ' at ' . Carbon::parse($this->log->follow_up_time)->format('g:i A');
        }

        return match ($this->action) {
            'scheduled'   => "A follow-up clinic visit has been scheduled for you on {$date}.",
            'rescheduled' => "Your follow-up clinic visit has been rescheduled to {$date}.",
            'cancelled'   => 'Your scheduled follow-up clinic visit has been cancelled.',
            default       => 'Your follow-up visit has been updated.',
        };
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
            'type'      => 'WalkinFollowUpNotification',
            'record_id' => $this->log->id,
            'message'   => $this->message(),
            'action'    => $this->action,
            'url'       => $this->url($notifiable),
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('Follow-up visit update')
            ->icon('/images/tpc-logo.png')
            ->body($this->message())
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 86400]);
    }
}