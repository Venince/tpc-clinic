<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RequirementType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'description', 'is_active', 'is_required',
        'sort_order', 'program_id', 'year_level',
    ];

    protected function casts(): array
    {
        return [
            'is_active'   => 'boolean',
            'is_required' => 'boolean',
            'year_level'  => 'integer',
        ];
    }

    public function userRequirements() { return $this->hasMany(UserRequirement::class); }
    public function program()          { return $this->belongsTo(Program::class); }
}