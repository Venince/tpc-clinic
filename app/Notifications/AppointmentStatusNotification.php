<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class AppointmentStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    protected function statusLabel(): array
    {
        $date = $this->record->appointment_date
            ? \Carbon\Carbon::parse($this->record->appointment_date)->format('M d, Y')
            : 'your appointment';

        return [
            'approved'  => "Your appointment on {$date} has been approved.",
            'declined'  => "Your appointment on {$date} has been declined.",
            'completed' => "Your appointment on {$date} has been marked as completed.",
            'cancelled' => "Your appointment on {$date} has been cancelled.",
        ];
    }

    public function toArray(object $notifiable): array
    {
        $status = $this->record->status ?? 'updated';
        $labels = $this->statusLabel();

        return [
            'type'      => 'AppointmentStatusNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => $labels[$status] ?? "Your appointment status has been updated to {$status}.",
            'status'    => $status,
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        $status = $this->record->status ?? 'updated';
        $labels = $this->statusLabel();
        $body   = $labels[$status] ?? "Your appointment status has been updated to {$status}.";

        return (new WebPushMessage)
            ->title('Appointment update')
            ->icon('/images/tpc-logo.png')
            ->body($body)
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 3600]);
    }
}
