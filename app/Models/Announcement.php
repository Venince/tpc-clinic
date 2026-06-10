<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Announcement extends Model {
    use SoftDeletes;
    protected $fillable = ['created_by','title','content','category','is_published','published_at','expires_at'];
    protected function casts(): array { return ['is_published'=>'boolean','published_at'=>'datetime','expires_at'=>'datetime']; }
    public function creator() { return $this->belongsTo(User::class,'created_by'); }
    public function scopePublished($q) { return $q->where('is_published',true)->where('published_at','<=',now()); }
    public function scopeNotExpired($q) { return $q->where(fn($q)=>$q->whereNull('expires_at')->orWhere('expires_at','>',now())); }
}
