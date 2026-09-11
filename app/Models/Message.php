<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Message extends Model {
    use SoftDeletes;
    protected $fillable = ['conversation_id','sender_id','body','attachments','is_read','read_at'];
    protected function casts(): array { return ['attachments'=>'array','is_read'=>'boolean','read_at'=>'datetime']; }
    public function conversation() { return $this->belongsTo(Conversation::class); }
    public function sender() { return $this->belongsTo(User::class,'sender_id'); }

    /**
     * Users who have chosen "Delete for me" on this specific message.
     * Deleting "for everyone" instead uses the normal soft-delete (deleted_at)
     * on this model, which hides the message from every participant.
     */
    public function deletedForUsers()
    {
        return $this->belongsToMany(User::class, 'message_deletions')->withTimestamps();
    }

    public function isDeletedForUser(int $userId): bool
    {
        return $this->deletedForUsers()->where('user_id', $userId)->exists();
    }

    /**
     * Only messages not soft-deleted (deleted for everyone, handled automatically
     * by SoftDeletes) AND not individually deleted-for-me by the given user
     * AND created after the last time this user deleted the conversation
     * (their "cleared_at" watermark on conversation_participants). Without
     * that last check, deleting a conversation and then messaging the same
     * person again would resurrect every old message, since deleting only
     * ever hid the conversation itself, not the messages inside it.
     */
    public function scopeVisibleFor($query, int $userId)
    {
        return $query
            ->whereDoesntHave('deletedForUsers', function ($q) use ($userId) {
                $q->where('message_deletions.user_id', $userId);
            })
            ->whereExists(function ($q) use ($userId) {
                $q->selectRaw('1')
                    ->from('conversation_participants')
                    ->whereColumn('conversation_participants.conversation_id', 'messages.conversation_id')
                    ->where('conversation_participants.user_id', $userId)
                    ->where(function ($q) {
                        $q->whereNull('conversation_participants.cleared_at')
                          ->orWhereColumn('messages.created_at', '>', 'conversation_participants.cleared_at');
                    });
            });
    }
}