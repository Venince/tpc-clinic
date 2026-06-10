<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ReportReadyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $title = $this->record->title ?? 'A report';

        return [
            'type'      => 'ReportReadyNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => "{$title} has been generated and is ready to download.",
        ];
    }
}