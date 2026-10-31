<?php

namespace App\Console\Commands;

use App\Jobs\SendCredentialsEmail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Recovers users whose "credentials" email failed (e.g. Gmail daily limit).
 *
 * For each failed SendCredentialsEmail job it looks at the user's CURRENT state:
 *  - never signed in + still must change password  -> new random password is set and
 *    a fresh credentials email is queued (the old password in the failed job may be
 *    stale, e.g. if an admin already set a temporary one)
 *  - already signed in / already changed password  -> nothing to do
 * Every handled failed_jobs row is deleted, which also removes the plaintext
 * password that Laravel stored in its payload.
 *
 * NOTE: this only sees jobs recorded in the failed_jobs table. With
 * QUEUE_CONNECTION=sync nothing is ever recorded there (the email is sent inside the
 * web request and a failure is only logged), so the command has nothing to recover.
 * Use QUEUE_CONNECTION=database or redis with a running worker to benefit from it.
 *
 * Run with --dry-run first. Use --limit to test a small batch (e.g. --limit=3).
 */
class RetryFailedCredentials extends Command
{
    protected $signature = 'credentials:retry-failed
        {--limit=0 : Maximum number of emails to queue in this run (0 = no limit)}
        {--spacing=2 : Seconds between queued emails, to avoid hammering the mail provider}
        {--dry-run : Report what would happen without changing or queuing anything}
        {--force : Run even though the mailer still looks like Gmail}';

    protected $description = 'Re-issue credentials to users whose credentials email failed and who have never signed in';

    public function handle(): int
    {
        $dry     = (bool) $this->option('dry-run');
        $limit   = max(0, (int) $this->option('limit'));
        $spacing = max(0, (int) $this->option('spacing'));

        $mailer = (string) config('mail.default');
        $host   = (string) config('mail.mailers.smtp.host');

        if ($mailer === 'log' || $mailer === 'array') {
            $this->error("MAIL_MAILER is '{$mailer}': emails would only be written to the log. Fix mail settings first.");
            return self::FAILURE;
        }

        if (config('queue.default') === 'sync') {
            $this->warn("QUEUE_CONNECTION is 'sync': failed sends are not recorded in failed_jobs, so there is usually nothing for this command to recover. Re-issued emails would also be sent immediately, one after another, inside this command.");
        }

        if (!$dry && !$this->option('force') && str_contains(strtolower($host), 'gmail')) {
            $this->error('The SMTP host is still Gmail, which is what hit the daily limit. Switch the mail provider first, or use --force.');
            return self::FAILURE;
        }

        $rows = DB::table('failed_jobs')
            ->where('payload', 'like', '%SendCredentialsEmail%')
            ->orderBy('id')
            ->get(['id', 'payload']);

        $stats = [
            'queued'            => 0,
            'already_signed_in' => 0,
            'inactive'          => 0,
            'user_missing'      => 0,
            'unreadable'        => 0,
            'left_for_later'    => 0,
        ];
        $delay = 0;

        foreach ($rows as $row) {
            if ($limit > 0 && $stats['queued'] >= $limit) {
                $stats['left_for_later']++;
                continue;
            }

            $userId = $this->extractUserId($row->payload, $missing);

            if ($missing) {
                // The user was deleted after the job failed; nothing to recover.
                $stats['user_missing']++;
                if (!$dry) {
                    DB::table('failed_jobs')->where('id', $row->id)->delete();
                }
                continue;
            }

            if ($userId === null) {
                $stats['unreadable']++;
                continue;
            }

            $user = User::find($userId);

            if (!$user) {
                $stats['user_missing']++;
                if (!$dry) {
                    DB::table('failed_jobs')->where('id', $row->id)->delete();
                }
                continue;
            }

            if ($user->last_login_at !== null || !$user->force_password_change) {
                $stats['already_signed_in']++;
                if (!$dry) {
                    DB::table('failed_jobs')->where('id', $row->id)->delete();
                }
                continue;
            }

            if (!$user->is_active) {
                $stats['inactive']++;
                continue;
            }

            if ($dry) {
                $this->line("[dry-run] would re-issue credentials to {$user->email}");
                $stats['queued']++;
                continue;
            }

            $password = User::generateTemporaryPassword();

            // The 'hashed' cast on User::password hashes this on assignment.
            // This replaces any temporary password an admin set by hand for this user.
            $user->forceFill([
                'password'              => $password,
                'force_password_change' => true,
                'remember_token'        => Str::random(60),
            ])->save();

            SendCredentialsEmail::dispatch($user, $password)
                ->delay(now()->addSeconds($delay));

            DB::table('failed_jobs')->where('id', $row->id)->delete();

            $delay += $spacing;
            $stats['queued']++;
        }

        $this->newLine();
        $this->info(($dry ? '[dry-run] ' : '') . 'Done.');
        $this->table(['Result', 'Count'], collect($stats)->map(fn ($v, $k) => [$k, $v])->values()->all());

        if ($stats['left_for_later'] > 0) {
            $this->line('Run the command again to process the remaining users.');
        }

        return self::SUCCESS;
    }

    /**
     * Pull the user's id out of a failed SendCredentialsEmail payload.
     *
     * @param  bool|null  $missing  set to true when the user no longer exists
     */
    private function extractUserId(string $payload, ?bool &$missing = null): ?int
    {
        $missing = false;

        $data       = json_decode($payload, true);
        $serialized = $data['data']['command'] ?? null;

        if (!is_string($serialized)) {
            return null;
        }

        try {
            $job = unserialize($serialized);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            $missing = true;
            return null;
        } catch (\Throwable $e) {
            return null;
        }

        if (!$job instanceof SendCredentialsEmail) {
            return null;
        }

        return (int) $job->user->id;
    }
}