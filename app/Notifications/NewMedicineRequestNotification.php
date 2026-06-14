<?php
namespace App\Notifications;

use Illuminate\Notifications\Notification;

class NewMedicineRequestNotification extends Notification
{
    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $medicineName = $this->record->medicine?->name ?? 'Unknown';
        $requesterName = $this->record->user?->name ?? 'A user';

        return [
            'type'      => 'NewMedicineRequestNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => "{$requesterName} requested {$this->record->quantity_requested} unit(s) of {$medicineName}.",
            'status'    => 'pending',
        ];
    }
}