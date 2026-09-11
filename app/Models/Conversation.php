<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Conversation extends Model {
    // 'subject' intentionally left out: conversations are named after the
    // other participant now, not a subject line. The column stays in the DB
    // (nullable) for any old rows, but new conversations never set it.
    protected $fillable = ['is_active','last_message_at'];
    protected function casts(): array { return ['is_active'=>'boolean','last_message_at'=>'datetime']; }
    public function participants() { return $this->belongsToMany(User::class,'conversation_participants')->withPivot('last_read_at','is_archived','deleted_at')->withTimestamps(); }
    public function messages() { return $this->hasMany(Message::class); }

    /**
     * Only conversations the given user has NOT deleted from their own inbox.
     * A conversation deleted by one participant stays hidden for them
     * permanently, even if the other participant sends a new message.
     */
    public function scopeVisibleFor($query, int $userId)
    {
        return $query->whereHas('participants', function ($q) use ($userId) {
            $q->where('conversation_participants.user_id', $userId)
              ->whereNull('conversation_participants.deleted_at');
        });
    }

    /**
     * Whether the given user has deleted this conversation from their own inbox.
     */
    public function isDeletedForUser(int $userId): bool
    {
        $pivot = $this->participants()->where('user_id', $userId)->first()?->pivot;
        return (bool) ($pivot?->deleted_at);
    }

    /**
     * A conversation whose participants are exactly this pair of users
     * (no other participants). Used to reuse an existing 1:1 thread instead
     * of creating a duplicate when a user starts a "new" conversation with
     * someone they've already messaged.
     */
    public function scopeBetween($query, int $userId1, int $userId2)
    {
        return $query
            ->whereHas('participants', fn($q) => $q->where('user_id', $userId1))
            ->whereHas('participants', fn($q) => $q->where('user_id', $userId2))
            ->whereDoesntHave('participants', fn($q) => $q->whereNotIn('user_id', [$userId1, $userId2]));
    }
}