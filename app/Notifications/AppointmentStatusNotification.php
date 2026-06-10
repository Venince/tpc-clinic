<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class AppointmentStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $status  = $this->record->status ?? 'updated';
        $date    = $this->record->appointment_date
            ? \Carbon\Carbon::parse($this->record->appointment_date)->format('M d, Y')
            : 'your appointment';

        $labels  = [
            'approved'  => "Your appointment on {$date} has been approved.",
            'declined'  => "Your appointment on {$date} has been declined.",
            'completed' => "Your appointment on {$date} has been marked as completed.",
            'cancelled' => "Your appointment on {$date} has been cancelled.",
        ];

        return [
            'type'       => 'AppointmentStatusNotification',
            'record_id'  => $this->record->id ?? null,
            'message'    => $labels[$status] ?? "Your appointment status has been updated to {$status}.",
            'status'     => $status,
        ];
    }
}