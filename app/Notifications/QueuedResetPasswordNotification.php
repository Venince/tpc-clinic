<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Laravel's stock reset-password email, but delivered by the queue worker so a slow
 * or rate-limited SMTP server can't tie up web workers.
 */
class QueuedResetPasswordNotification extends ResetPassword implements ShouldQueue
{
    use Queueable;

    public int $tries = 6;

    /** Seconds between retries: 1m, 10m, 1h, 3h, 6h (rides out provider rate limits). */
    public array $backoff = [60, 600, 3600, 10800, 21600];
}