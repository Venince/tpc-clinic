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
     * by SoftDeletes) AND not individually deleted-for-me by the given user.
     */
    public function scopeVisibleFor($query, int $userId)
    {
        return $query->whereDoesntHave('deletedForUsers', function ($q) use ($userId) {
            $q->where('message_deletions.user_id', $userId);
        });
    }
}