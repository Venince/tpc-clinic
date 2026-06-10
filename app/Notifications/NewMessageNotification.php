<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly mixed $record) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $sender = $this->record->sender ?? null;
        $senderName = $sender?->name ?? 'Someone';
        $conversationId = $this->record->conversation_id ?? $this->record->id ?? null;

        return [
            'type'            => 'NewMessageNotification',
            'record_id'       => $conversationId,
            'message'         => "{$senderName} sent you a message.",
            'sender_name'     => $senderName,
            'conversation_id' => $conversationId,
        ];
    }
}