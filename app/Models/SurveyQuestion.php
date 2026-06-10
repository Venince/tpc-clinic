<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class SurveyQuestion extends Model {
    use SoftDeletes;
    protected $fillable = ['question','type','options','is_required','sort_order','is_active'];
    protected function casts(): array { return ['options'=>'array','is_required'=>'boolean','is_active'=>'boolean']; }
    public function answers() { return $this->hasMany(SurveyAnswer::class); }
}
