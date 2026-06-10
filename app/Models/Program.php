<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Program extends Model {
    use SoftDeletes;
    protected $fillable = ['code', 'name', 'description', 'is_active'];
    protected function casts(): array { return ['is_active' => 'boolean']; }
    public function studentProfiles() { return $this->hasMany(StudentProfile::class); }
}
