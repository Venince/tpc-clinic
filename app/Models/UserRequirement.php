<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class UserRequirement extends Model {
    protected $fillable = ['user_id','requirement_type_id','file_path','original_filename','mime_type','file_size','verification_status','approval_status','rejection_reason','reviewed_by','reviewed_at'];
    protected function casts(): array { return ['reviewed_at'=>'datetime']; }
    public function user() { return $this->belongsTo(User::class); }
    public function requirementType() { return $this->belongsTo(RequirementType::class); }
    public function reviewer() { return $this->belongsTo(User::class,'reviewed_by'); }
}
