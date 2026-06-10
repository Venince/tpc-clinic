<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class MedicineRequestStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $status       = $this->record->status ?? 'updated';
        $medicineName = $this->record->medicine?->name ?? 'your medicine request';

        $labels = [
            'approved'  => "Your request for {$medicineName} has been approved.",
            'rejected'  => "Your request for {$medicineName} has been rejected.",
            'released'  => "Your request for {$medicineName} is ready for pickup.",
        ];

        return [
            'type'      => 'MedicineRequestStatusNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => $labels[$status] ?? "Your medicine request status has been updated to {$status}.",
            'status'    => $status,
        ];
    }
}