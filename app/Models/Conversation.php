<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Conversation extends Model {
    protected $fillable = ['subject','is_active','last_message_at'];
    protected function casts(): array { return ['is_active'=>'boolean','last_message_at'=>'datetime']; }
    public function participants() { return $this->belongsToMany(User::class,'conversation_participants')->withPivot('last_read_at','is_archived')->withTimestamps(); }
    public function messages() { return $this->hasMany(Message::class); }
}
