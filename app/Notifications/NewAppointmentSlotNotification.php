<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewAppointmentSlotNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    /**
     * Date-level wording (no times) because several slots created for the same
     * day are collapsed into a single notification by AppointmentService.
     */
    protected function message(): string
    {
        $date = $this->record->date?->format('M j, Y') ?? 'an upcoming date';

        return "New appointment slots are available on {$date}. Book now!";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'NewAppointmentSlotNotification',
            'record_id' => $this->record->id ?? null,
            'date'      => $this->record->date?->toDateString(),
            'message'   => $this->message(),
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('New appointment slots')
            ->icon('/images/tpc-logo.png')
            ->body($this->message())
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 86400]);
    }
}