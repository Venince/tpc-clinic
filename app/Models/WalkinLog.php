<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WalkinLog extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'logged_by', 'visited_at',
        'chief_complaint', 'vital_signs', 'diagnosis',
        'treatment', 'medicines_dispensed', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'visited_at'          => 'datetime',
            'vital_signs'         => 'array',
            'medicines_dispensed' => 'array',
        ];
    }

    public function user()     { return $this->belongsTo(User::class); }
    public function loggedBy() { return $this->belongsTo(User::class, 'logged_by'); }
}