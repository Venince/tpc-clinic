<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class PasswordChangedByAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly ?User $changedBy = null) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    protected function message(): string
    {
        $adminName = $this->changedBy?->name ?? 'an administrator';

        return "Your password was changed by {$adminName}. If you did not request this, please contact the clinic immediately.";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'    => 'PasswordChangedByAdminNotification',
            'message' => $this->message(),
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('Password changed')
            ->icon('/images/tpc-logo.png')
            ->body($this->message())
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 86400]);
    }
}