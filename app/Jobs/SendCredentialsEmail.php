<?php
namespace App\Jobs;
use App\Mail\CredentialsMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendCredentialsEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public int $tries = 6;
    /** Seconds between retries: 1m, 10m, 1h, 3h, 6h (rides out provider rate limits). */
    public array $backoff = [60, 600, 3600, 10800, 21600];
    public function __construct(public readonly User $user, public readonly string $password) {}
    public function handle(): void { Mail::to($this->user->email)->send(new CredentialsMail($this->user, $this->password)); }

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