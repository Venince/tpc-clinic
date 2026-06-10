<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class MedicineRequest extends Model {
    protected $fillable = ['user_id','medicine_id','quantity_requested','quantity_released','reason','status','rejection_reason','reviewed_by','reviewed_at','released_at'];
    protected function casts(): array { return ['reviewed_at'=>'datetime','released_at'=>'datetime']; }
    public function user() { return $this->belongsTo(User::class); }
    public function medicine() { return $this->belongsTo(Medicine::class); }
    public function reviewer() { return $this->belongsTo(User::class,'reviewed_by'); }
}
