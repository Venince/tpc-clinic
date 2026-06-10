<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class RequirementType extends Model {
    use SoftDeletes;
    protected $fillable = ['name','description','is_active','sort_order'];
    protected function casts(): array { return ['is_active'=>'boolean']; }
    public function userRequirements() { return $this->hasMany(UserRequirement::class); }
}
