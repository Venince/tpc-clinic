<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use NotificationChannels\WebPush\HasPushSubscriptions;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes, HasPushSubscriptions;

    /**
     * Characters used for temporary passwords. Look-alikes are removed on purpose
     * (no 0/O, 1/l/I) because people retype these from an email, and a single
     * misread character counts as a failed attempt toward the login lockout.
     */
    public const TEMP_PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

    protected $fillable = [
        'role_id', 'name', 'email', 'password', 'is_active',
        'force_password_change', 'last_login_at', 'last_login_ip', 'profile_photo_path',
    ];

    // 'email_active' is a generated column added by the optional
    // 2026_10_31_000001_enforce_unique_active_user_email migration.
    protected $hidden = ['password', 'remember_token', 'email_active'];

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

    /**
     * A random temporary password that is easy to read and retype.
     * ~57 bits of entropy at the default length, and it is only valid until the
     * user's first password change.
     */
    public static function generateTemporaryPassword(int $length = 10): string
    {
        $alphabet = self::TEMP_PASSWORD_ALPHABET;
        $max      = strlen($alphabet) - 1;
        $password = '';

        for ($i = 0; $i < $length; $i++) {
            $password .= $alphabet[random_int(0, $max)];
        }

        return $password;
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

    /**
     * Send the password-reset email through the queue. The default implementation
     * sends synchronously, which holds a PHP-FPM worker open while it talks to the
     * SMTP server. When the mail provider is slow or rate-limiting, workers pile up
     * and the whole site returns 500/504 errors.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\QueuedResetPasswordNotification($token));
    }
}