<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class StudentProfile extends Model {
    protected $fillable = ['user_id','program_id','student_id','year_level','block','birth_date','sex','contact_number','address','guardian_name','guardian_contact','civil_status','is_pregnant','pregnancy_due_date','medical_notes'];
    protected function casts(): array { return ['birth_date'=>'date','pregnancy_due_date'=>'date','is_pregnant'=>'boolean']; }
    public function user() { return $this->belongsTo(User::class); }
    public function program() { return $this->belongsTo(Program::class); }
}
