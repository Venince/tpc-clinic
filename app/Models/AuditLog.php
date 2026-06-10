<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AuditLog extends Model {
    public $timestamps = false;
    const UPDATED_AT = null;
    protected $fillable = ['user_id','action','model_type','model_id','old_values','new_values','ip_address','user_agent','description'];
    protected function casts(): array { return ['old_values'=>'array','new_values'=>'array','created_at'=>'datetime']; }
    public function user() { return $this->belongsTo(User::class); }
}
