<?php

namespace App\Services;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MessagingService
{
    public function __construct(private AuditService $auditService) {}

    public function startConversation(int $senderId, int $recipientId, string $subject, string $body, array $attachmentFiles = []): Conversation
    {
        $sender    = User::findOrFail($senderId);
        $recipient = User::findOrFail($recipientId);

        // Validate allowed conversation pairs
        $this->validateConversationPair($sender, $recipient);

        return DB::transaction(function () use ($senderId, $recipientId, $subject, $body, $attachmentFiles) {
            $conversation = Conversation::create([
                'subject'         => $subject,
                'last_message_at' => now(),
            ]);

            $conversation->participants()->attach([$senderId, $recipientId]);

            $message = $this->addMessage($conversation, $senderId, $body, $attachmentFiles);

            return $conversation->load('participants', 'messages');
        });
    }

    public function addMessage(Conversation $conversation, int $senderId, string $body, array $files = []): Message
    {
        // Check sender is participant
        if (!$conversation->participants()->where('user_id', $senderId)->exists()) {
            throw ValidationException::withMessages(['conversation' => ['You are not a participant in this conversation.']]);
        }

        $attachments = [];
        foreach ($files as $file) {
            $path = $file->store('messages/attachments', 'private');
            $attachments[] = [
                'path' => $path,
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
            ];
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $senderId,
            'body'            => $body,
            'attachments'     => $attachments ?: null,
        ]);

        $conversation->update(['last_message_at' => now()]);

        // Notify other participants
        $otherParticipants = $conversation->participants()->where('user_id', '!=', $senderId)->get();
        foreach ($otherParticipants as $participant) {
            $participant->notify(new NewMessageNotification($message));
        }

        // Broadcast for real-time (Laravel Broadcasting)
        event(new MessageSent($message));

        return $message->load('sender');
    }

    public function markAsRead(Conversation $conversation, int $userId): void
    {
        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $conversation->participants()
            ->where('user_id', $userId)
            ->updateExistingPivot($userId, ['last_read_at' => now()]);
    }

    public function getUserConversations(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return Conversation::whereHas('participants', fn($q) => $q->where('user_id', $userId))
            ->with(['participants:id,name,email', 'messages' => fn($q) => $q->latest()->limit(1)])
            ->withCount(['messages as unread_count' => fn($q) => $q->where('sender_id', '!=', $userId)->where('is_read', false)])
            ->orderByDesc('last_message_at')
            ->get();
    }

    private function validateConversationPair(User $sender, User $recipient): void
    {
        $senderRole    = $sender->role->name;
        $recipientRole = $recipient->role->name;

        $allowedPairs = [
            ['student', 'admin'], ['admin', 'student'],
            ['student', 'super_admin'], ['super_admin', 'student'],
            ['faculty_staff', 'admin'], ['admin', 'faculty_staff'],
            ['faculty_staff', 'super_admin'], ['super_admin', 'faculty_staff'],
            ['admin', 'super_admin'], ['super_admin', 'admin'],
        ];

        $pair = [$senderRole, $recipientRole];
        if (!in_array($pair, $allowedPairs)) {
            throw ValidationException::withMessages([
                'recipient' => ['Messaging is not allowed between these roles.'],
            ]);
        }
    }
}
