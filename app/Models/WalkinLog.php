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
        'follow_up_date', 'follow_up_time', 'follow_up_notes', 'follow_up_status',
        'follow_up_scheduled_by',
    ];

    protected function casts(): array
    {
        return [
            'visited_at'          => 'datetime',
            'vital_signs'         => 'array',
            'medicines_dispensed' => 'array',
            'follow_up_date'      => 'date:Y-m-d',
            'follow_up_reminder_day_before_sent_at' => 'datetime',
            'follow_up_reminder_day_of_sent_at'     => 'datetime',
        ];
    }

    public function user()               { return $this->belongsTo(User::class); }
    public function loggedBy()           { return $this->belongsTo(User::class, 'logged_by'); }
    public function followUpScheduledBy(){ return $this->belongsTo(User::class, 'follow_up_scheduled_by'); }

    public function hasActiveFollowUp(): bool
    {
        return $this->follow_up_status === 'scheduled' && $this->follow_up_date !== null;
    }

    public function scopeWithActiveFollowUp($query)
    {
        return $query->where('follow_up_status', 'scheduled')->whereNotNull('follow_up_date');
    }
}