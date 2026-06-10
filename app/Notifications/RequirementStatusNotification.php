<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class RequirementStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $status          = $this->record->status ?? 'updated';
        $requirementName = $this->record->requirementType?->name ?? 'a requirement';

        $labels = [
            'approved' => "Your submission for {$requirementName} has been approved.",
            'rejected' => "Your submission for {$requirementName} was rejected. Please re-upload.",
        ];

        return [
            'type'      => 'RequirementStatusNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => $labels[$status] ?? "Your requirement ({$requirementName}) status has been updated.",
            'status'    => $status,
        ];
    }
}