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

    public function startConversation(int $senderId, int $recipientId, string $body, array $attachmentFiles = []): Conversation
    {
        $sender    = User::findOrFail($senderId);
        $recipient = User::findOrFail($recipientId);

        $this->validateConversationPair($sender, $recipient);

        return DB::transaction(function () use ($senderId, $recipientId, $body, $attachmentFiles) {
            $conversation = Conversation::between($senderId, $recipientId)->first();

            if ($conversation) {
                // Reusing an existing thread. If the sender had previously
                // deleted it from their own inbox, bring it back into their
                // list — they're clearly messaging this person again on
                // purpose — but only reset `deleted_at` (list visibility).
                // `cleared_at` (the message watermark) is left untouched on
                // purpose, so messages from before the delete stay hidden
                // for the sender. Only messages sent from this point on will
                // show up for them.
                $conversation->participants()->updateExistingPivot($senderId, ['deleted_at' => null]);
            } else {
                $conversation = Conversation::create([
                    'last_message_at' => now(),
                ]);
                $conversation->participants()->attach([$senderId, $recipientId]);
            }

            $this->addMessage($conversation, $senderId, $body, $attachmentFiles);

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
        // Note: if a participant previously deleted this conversation from their
        // own inbox, it intentionally stays hidden for them even though a new
        // message just arrived. We still notify them so they aren't left unaware.
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
        return Conversation::visibleFor($userId)
            ->with(['participants:id,name,email', 'messages' => fn($q) => $q->latest()->limit(1)])
            ->withCount(['messages as unread_count' => fn($q) => $q->where('sender_id', '!=', $userId)->where('is_read', false)])
            ->orderByDesc('last_message_at')
            ->get();
    }

    /**
     * Messages visible to this user: not deleted-for-everyone (handled by the
     * model's normal soft-delete) and not individually deleted-for-me by them.
     */
    public function getVisibleMessages(Conversation $conversation, int $userId, int $perPage = 50)
    {
        return Message::where('conversation_id', $conversation->id)
            ->visibleFor($userId)
            ->with('sender:id,name,profile_photo_path')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Hide an entire conversation from ONE participant's inbox. The other
     * participant is completely unaffected and keeps full access to it.
     * If every participant has now deleted it, the conversation and its
     * messages are permanently purged since nobody can see it anymore.
     */
    public function deleteConversationForUser(Conversation $conversation, int $userId): void
    {
        if (!$conversation->participants()->where('user_id', $userId)->exists()) {
            throw ValidationException::withMessages(['conversation' => ['You are not a participant in this conversation.']]);
        }

        $now = now();

        // `deleted_at` hides the conversation from this user's inbox list.
        // `cleared_at` is the permanent watermark: messages sent before this
        // moment will never be shown to this user again for this
        // conversation, even if it's later revived by a new message. Unlike
        // `deleted_at`, this value is never reset back to null.
        $conversation->participants()->updateExistingPivot($userId, [
            'deleted_at' => $now,
            'cleared_at' => $now,
        ]);

        $stillVisibleToSomeone = $conversation->participants()
            ->wherePivotNull('deleted_at')
            ->exists();

        if (!$stillVisibleToSomeone) {
            $this->purgeConversation($conversation);
        }
    }

    private function purgeConversation(Conversation $conversation): void
    {
        DB::table('notifications')
            ->where('type', NewMessageNotification::class)
            ->where(
                DB::raw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.conversation_id'))"),
                $conversation->id
            )
            ->delete();

        Message::withTrashed()->where('conversation_id', $conversation->id)->forceDelete();
        $conversation->participants()->detach();
        $conversation->delete();
    }

    /**
     * "Delete for me": hides one message from just this user. Any other
     * participant (including the sender) still sees it normally.
     */
    public function deleteMessageForUser(Message $message, int $userId): void
    {
        if (!$message->conversation->participants()->where('user_id', $userId)->exists()) {
            throw ValidationException::withMessages(['message' => ['You are not a participant in this conversation.']]);
        }

        $message->deletedForUsers()->syncWithoutDetaching([$userId]);
    }

    /**
     * "Delete for everyone": only the original sender may do this. It removes
     * the message for every participant via the model's normal soft-delete.
     */
    public function deleteMessageForEveryone(Message $message, int $userId): void
    {
        if ((int) $message->sender_id !== $userId) {
            throw ValidationException::withMessages([
                'message_ids' => ['Only the sender can delete a message for everyone.'],
            ]);
        }

        $message->delete();
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