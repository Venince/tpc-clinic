<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class LowStockAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    protected function message(): string
    {
        $name     = $this->record->name ?? 'A medicine';
        $quantity = $this->record->quantity ?? 0;

        return "{$name} is low on stock ({$quantity} remaining).";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'LowStockAlertNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => $this->message(),
            'quantity'  => $this->record->quantity ?? 0,
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('Low stock alert')
            ->icon('/images/tpc-logo.png')
            ->body($this->message())
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 86400]);
    }
}