<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewMedicineRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    protected function message(): string
    {
        $medicineName  = $this->record->medicine?->name ?? 'Unknown';
        $requesterName = $this->record->user?->name ?? 'A user';

        return "{$requesterName} requested {$this->record->quantity_requested} unit(s) of {$medicineName}.";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'NewMedicineRequestNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => $this->message(),
            'status'    => 'pending',
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('New medicine request')
            ->icon('/images/tpc-logo.png')
            ->body($this->message())
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 3600]);
    }
}