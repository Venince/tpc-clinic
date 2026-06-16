<?php

namespace App\Notifications;

use App\Models\WalkinLog;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class WalkinLogNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly WalkinLog $log) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $date = Carbon::parse($this->log->visited_at)->format('M d, Y');
        $time = Carbon::parse($this->log->visited_at)->format('g:i A');

        // Build a short summary of what was recorded
        $details = [];
        if ($this->log->diagnosis)
            $details[] = "Diagnosis: {$this->log->diagnosis}";
        if ($this->log->treatment)
            $details[] = "Treatment: {$this->log->treatment}";
        if (!empty($this->log->medicines_dispensed))
            $details[] = count($this->log->medicines_dispensed) . ' medicine(s) dispensed';

        $summary = count($details) ? implode(' · ', $details) : $this->log->chief_complaint;

        // Resolve the deep-link URL based on the patient's role
        $role     = $notifiable->role?->name;
        $url      = match ($role) {
            'student'       => route('student.walkin.index', ['highlight' => $this->log->id]),
            'faculty_staff' => route('faculty.walkin.index', ['highlight' => $this->log->id]),
            default         => null,
        };

        return [
            'type'       => 'WalkinLogNotification',
            'record_id'  => $this->log->id,
            'message'    => "A clinic walk-in visit was recorded for you on {$date} at {$time}.",
            'sub'        => $summary,
            'url'        => $url,
        ];
    }
}
