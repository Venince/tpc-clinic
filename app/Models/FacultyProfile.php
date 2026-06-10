<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class FacultyProfile extends Model {
    protected $fillable = ['user_id','employee_id','department','position','birth_date','sex','contact_number','address','civil_status','is_pregnant','pregnancy_due_date','medical_notes'];
    protected function casts(): array { return ['birth_date'=>'date','pregnancy_due_date'=>'date','is_pregnant'=>'boolean']; }
    public function user() { return $this->belongsTo(User::class); }
}
