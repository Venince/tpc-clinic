<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LowStockAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name     = $this->record->name ?? 'A medicine';
        $quantity = $this->record->quantity ?? 0;

        return [
            'type'      => 'LowStockAlertNotification',
            'record_id' => $this->record->id ?? null,
            'message'   => "{$name} is low on stock ({$quantity} remaining).",
            'quantity'  => $quantity,
        ];
    }
}