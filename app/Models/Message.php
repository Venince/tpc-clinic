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
}
