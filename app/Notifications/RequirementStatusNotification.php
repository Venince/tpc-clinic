<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class RequirementStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    protected function message(): string
    {
        $status          = $this->record->status ?? 'updated';
        $requirementName = $this->record->requirementType?->name ?? 'a requirement';

        $labels = [
            'approved' => "Your submission for {$requirementName} has been approved.",
            'rejected' => "Your submission for {$requirementName} was rejected. Please re-upload.",
        ];

        return $labels[$status] ?? "Your requirement ({$requirementName}) status has been updated.";
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'      => 'RequirementStatusNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => $this->message(),
            'status'    => $this->record->status ?? 'updated',
        ];
    }

    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('Requirement update')
            ->icon('/images/tpc-logo.png')
            ->body($this->message())
            ->data(['notification_id' => $notification->id])
            ->options(['TTL' => 86400]);
    }
}