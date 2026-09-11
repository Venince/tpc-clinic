<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewAppointmentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    protected function message(): string
    {
        $requesterName = $this->record->user?->name ?? 'A user';
        $date          = $this->record->slot?->date?->format('M j, Y') ?? 'an upcoming date';

        return "{$requesterName} booked an appointment for {$date}.";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'NewAppointmentNotification',
            'record_id' => $this->record->id ?? null,
            'date'      => $this->record->slot?->date?->toDateString(),
            'message'   => $this->message(),
            'status'    => 'pending',
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('New appointment booked')
            ->icon('/images/tpc-logo.png')
            ->body($this->message())
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 3600]);
    }
}