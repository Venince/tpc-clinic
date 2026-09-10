<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Program extends Model {
    use SoftDeletes;
    protected $fillable = ['code', 'name', 'description', 'is_active', 'logo_path'];
    protected $appends = ['logo_url'];
    protected function casts(): array { return ['is_active' => 'boolean']; }
    public function getLogoUrlAttribute() {
        return $this->logo_path ? asset('storage/' . $this->logo_path) : null;
    }
    public function studentProfiles() { return $this->hasMany(StudentProfile::class); }
}