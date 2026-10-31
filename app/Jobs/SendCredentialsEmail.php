<?php

namespace App\Jobs;

use App\Mail\CredentialsMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendCredentialsEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 6;

    /** Seconds between retries: 1m, 10m, 1h, 3h, 6h (rides out provider rate limits). */
    public array $backoff = [60, 600, 3600, 10800, 21600];

    /** If the user was hard-deleted while the job waited, drop it instead of retrying. */
    public bool $deleteWhenMissingModels = true;

    public function __construct(public readonly User $user, public readonly string $password) {}

    public function handle(): void
    {
        // SerializesModels reloads the user from the database when the job runs, so
        // this is the user's CURRENT state, not the state at dispatch time.
        $user = $this->user;

        // Never send an email whose password would no longer work. This happens when
        // the job sits in the queue (or retries after a provider failure) while an
        // admin sets a different temporary password, or the user already signed in
        // and changed it. A stale password in an email is worse than no email.
        if (
            $user->trashed()
            || !$user->is_active
            || !$user->force_password_change
            || $user->last_login_at !== null
            || !Hash::check($this->password, $user->password)
        ) {
            Log::info('Credentials email skipped: it would no longer be valid', [
                'user_id' => $user->id,
            ]);

            return;
        }

        Mail::to($user->email)->send(new CredentialsMail($user, $this->password));
    }

    /** Called once all retries are exhausted. Without this the failure is invisible. */
    public function failed(\Throwable $e): void
    {
        Log::error('Credentials email permanently failed', [
            'user_id' => $this->user->id,
            'email'   => $this->user->email,
            'error'   => $e->getMessage(),
        ]);
    }
}