<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Report extends Model {
    protected $fillable = ['generated_by','type','title','filters','file_path','format','status','completed_at'];
    protected function casts(): array { return ['filters'=>'array','completed_at'=>'datetime']; }
    public function generatedBy() { return $this->belongsTo(User::class,'generated_by'); }
}
