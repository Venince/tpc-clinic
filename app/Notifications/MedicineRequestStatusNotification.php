<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class MedicineRequestStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    protected function message(): string
    {
        $status       = $this->record->status ?? 'updated';
        $medicineName = $this->record->medicine?->name ?? 'your medicine request';

        $labels = [
            'approved' => "Your request for {$medicineName} has been approved.",
            'rejected' => "Your request for {$medicineName} has been rejected.",
            'released' => "Your request for {$medicineName} is ready for pickup.",
        ];

        return $labels[$status] ?? "Your medicine request status has been updated to {$status}.";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'MedicineRequestStatusNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => $this->message(),
            'status'    => $this->record->status ?? 'updated',
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('Medicine request update')
            ->icon('/images/tpc-logo.png')
            ->body($this->message())
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 3600]);
    }
}