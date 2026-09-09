<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Conversation extends Model {
    protected $fillable = ['subject','is_active','last_message_at'];
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
}