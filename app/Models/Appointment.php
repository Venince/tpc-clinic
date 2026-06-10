<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Appointment extends Model {
    use SoftDeletes;
    protected $fillable = ['user_id','appointment_slot_id','purpose','notes','status','decline_reason','reviewed_by','reviewed_at'];
    protected function casts(): array { return ['reviewed_at'=>'datetime']; }
    public function user() { return $this->belongsTo(User::class); }
    public function slot() { return $this->belongsTo(AppointmentSlot::class,'appointment_slot_id'); }
    public function reviewer() { return $this->belongsTo(User::class,'reviewed_by'); }
}
