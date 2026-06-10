<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AppointmentSlot extends Model {
    protected $fillable = ['date','start_time','end_time','max_appointments','booked_count','is_available','notes','created_by'];
    protected function casts(): array { return ['date'=>'date','is_available'=>'boolean','max_appointments'=>'integer','booked_count'=>'integer']; }
    public function appointments() { return $this->hasMany(Appointment::class); }
    public function creator() { return $this->belongsTo(User::class,'created_by'); }
    public function isFullyBooked(): bool { return $this->booked_count >= $this->max_appointments; }
    public function availableSlots(): int { return max(0,$this->max_appointments-$this->booked_count); }
}
