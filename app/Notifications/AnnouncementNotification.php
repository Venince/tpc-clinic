<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class AnnouncementNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'AnnouncementNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => "New announcement: {$this->record->title}",
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('New announcement')
            ->icon('/images/tpc-logo.png')
            ->body($this->record->title)
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 86400]);
    }
}
