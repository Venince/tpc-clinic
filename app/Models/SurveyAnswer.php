<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class SurveyAnswer extends Model {
    protected $fillable = ['user_id','survey_question_id','answer'];
    protected function casts(): array { return ['answer'=>'array']; }
    public function user() { return $this->belongsTo(User::class); }
    public function question() { return $this->belongsTo(SurveyQuestion::class,'survey_question_id'); }
}
