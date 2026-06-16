<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'role_id', 'name', 'email', 'password', 'is_active',
        'force_password_change', 'last_login_at', 'last_login_ip', 'profile_photo_path',
    ];

    protected $hidden = ['password', 'remember_token'];

    /**
     * Always serialize profile_photo_url so every Inertia page and API resource
     * receives the computed URL without needing to touch individual controllers.
     */
    protected $appends = ['profile_photo_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at'     => 'datetime',
            'password'              => 'hashed',
            'is_active'             => 'boolean',
            'force_password_change' => 'boolean',
            'last_login_at'         => 'datetime',
        ];
    }

    public function role()           { return $this->belongsTo(Role::class); }
    public function studentProfile() { return $this->hasOne(StudentProfile::class); }
    public function facultyProfile() { return $this->hasOne(FacultyProfile::class); }
    public function appointments()   { return $this->hasMany(Appointment::class); }
    public function medicineRequests() { return $this->hasMany(MedicineRequest::class); }
    public function requirements()   { return $this->hasMany(UserRequirement::class); }
    public function surveyAnswers()  { return $this->hasMany(SurveyAnswer::class); }
    public function conversations()  {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot('last_read_at', 'is_archived')->withTimestamps();
    }
    public function sentMessages() { return $this->hasMany(Message::class, 'sender_id'); }

    public function isStudent(): bool       { return $this->role->name === 'student'; }
    public function isFaculty(): bool       { return $this->role->name === 'faculty_staff'; }
    public function isAdmin(): bool         { return $this->role->name === 'admin'; }
    public function isSuperAdmin(): bool    { return $this->role->name === 'super_admin'; }
    public function isAdminOrHigher(): bool { return in_array($this->role->name, ['admin', 'super_admin']); }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        return $this->profile_photo_path
            ? asset('storage/' . $this->profile_photo_path)
            : null;
    }

    public function walkinLogs()
    {
        return $this->hasMany(\App\Models\WalkinLog::class, 'user_id');
    }
}
