<?php

namespace App\Console\Commands;

use App\Jobs\SendCredentialsEmail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Resolves emails that belong to more than one ACTIVE account (usually created by an
 * import that was submitted twice).
 *
 * For every duplicated email it picks ONE account to keep:
 *   1. the account that has signed in, or has any data (profile, appointments,
 *      medicine requests, requirements, survey answers, walk-in logs, messages);
 *   2. if none has either, the oldest account (lowest id, which is the one the login
 *      form was already resolving to).
 * The other accounts are SOFT-deleted (restorable), which frees the email.
 *
 * A group is skipped and reported for manual review when more than one account has
 * signed in or holds data, or when the accounts have different roles.
 *
 * Without --apply nothing is changed (dry run). Back up the database first.
 *
 * --reissue (with --apply) then gives each kept account that has never signed in a NEW
 * temporary password and emails it, because those people hold two emails with two
 * different passwords and cannot tell which one works. Tell them to use the newest email.
 */
class DedupeUserEmails extends Command
{
    protected $signature = 'users:dedupe-emails
        {--apply : Actually soft-delete the duplicates (without this it is a dry run)}
        {--reissue : With --apply, send a NEW temporary password to kept accounts that never signed in}
        {--limit=0 : Maximum number of credentials emails to send in this run (0 = no limit)}
        {--spacing=2 : Seconds between emails, to stay under the mail provider rate limit}';

    protected $description = 'Soft-delete duplicate active accounts that share an email, keeping the one in use';

    private const MAX_CONSECUTIVE_MAIL_FAILURES = 3;

    public function handle(): int
    {
        $apply   = (bool) $this->option('apply');
        $reissue = (bool) $this->option('reissue');
        $limit   = max(0, (int) $this->option('limit'));
        $spacing = max(0, (int) $this->option('spacing'));

        if ($reissue && $apply) {
            $mailer = (string) config('mail.default');
            if ($mailer === 'log' || $mailer === 'array') {
                $this->error("MAIL_MAILER is '{$mailer}': emails would only be written to the log. Fix the mail settings first.");
                return self::FAILURE;
            }
        }

        $this->info($apply ? 'APPLY mode: duplicates will be soft-deleted.' : 'DRY RUN: nothing will be changed. Add --apply to do it.');

        // The SoftDeletes scope already excludes deleted users.
        $emails = User::query()->groupBy('email')->havingRaw('COUNT(*) > 1')->pluck('email');

        $stats      = ['groups' => $emails->count(), 'resolved' => 0, 'needs_review' => 0, 'removed' => 0];
        $candidates = []; // kept accounts that should receive a fresh temporary password

        foreach ($emails as $email) {
            $users = User::where('email', $email)->orderBy('id')->get();

            if ($users->pluck('role_id')->unique()->count() > 1) {
                $stats['needs_review']++;
                $this->warn("REVIEW  {$email}: the accounts have different roles (ids " . $users->pluck('id')->implode(', ') . ').');
                continue;
            }

            $info = $users->map(fn (User $u) => [
                'user'      => $u,
                'signed_in' => $u->last_login_at !== null,
                'has_data'  => $this->hasData($u),
            ]);

            $inUse = $info->filter(fn ($i) => $i['signed_in'] || $i['has_data']);

            if ($inUse->count() > 1) {
                $stats['needs_review']++;
                $this->warn("REVIEW  {$email}: more than one account is in use (ids " . $inUse->map(fn ($i) => $i['user']->id)->implode(', ') . '). Merge manually.');
                continue;
            }

            $keeper = $inUse->first() ?? $info->first();
            $others = $info->reject(fn ($i) => $i['user']->id === $keeper['user']->id);

            $this->line(sprintf(
                '%s  %s: keep #%d, remove %s',
                $apply ? 'FIXED ' : 'would ',
                $email,
                $keeper['user']->id,
                '#' . $others->map(fn ($i) => $i['user']->id)->implode(', #')
            ));

            foreach ($others as $other) {
                if ($apply) {
                    $other['user']->delete(); // soft delete, restorable
                    Log::info('Duplicate user soft-deleted', ['user_id' => $other['user']->id, 'kept' => $keeper['user']->id]);
                }
                $stats['removed']++;
            }

            $stats['resolved']++;

            $k = $keeper['user'];
            if ($k->last_login_at === null && $k->force_password_change && $k->is_active) {
                $candidates[] = $k;
            }
        }

        $this->newLine();
        $this->table(['Result', 'Count'], collect($stats)->map(fn ($v, $k) => [$k, $v])->values()->all());

        if ($reissue) {
            $this->reissueCredentials($candidates, $apply, $limit, $spacing);
        } elseif (!empty($candidates)) {
            $this->line(count($candidates) . ' kept account(s) have never signed in. Run again with --apply --reissue to email them a new temporary password.');
        }

        if ($stats['needs_review'] > 0) {
            $this->warn('Resolve the REVIEW groups by hand, then run this command again before running the migration.');
        } elseif ($apply) {
            $this->info('No duplicates are left. You can now run: php artisan migrate --force');
        }

        return self::SUCCESS;
    }

    /** @param  User[]  $users */
    private function reissueCredentials(array $users, bool $apply, int $limit, int $spacing): void
    {
        if (!$apply) {
            $this->line('[dry-run] would send a new temporary password to ' . count($users) . ' account(s).');
            return;
        }

        $sync   = config('queue.default') === 'sync';
        $sent   = 0;
        $failed = [];
        $pending = []; // not processed (limit reached or sending aborted)
        $consecutive = 0;
        $aborted = false;

        foreach (array_values($users) as $i => $user) {
            if ($limit > 0 && ($sent + count($failed)) >= $limit) {
                $pending[] = $user->email;
                continue;
            }

            $password = User::generateTemporaryPassword();

            // Saved first because the job refuses to send a password that no longer matches.
            $user->forceFill([
                'password'              => $password,
                'force_password_change' => true,
                'remember_token'        => Str::random(60),
            ])->save();

            try {
                $dispatch = SendCredentialsEmail::dispatch($user, $password);
                if (!$sync) {
                    $dispatch->delay(now()->addSeconds($i * $spacing));
                }
                $sent++;
                $consecutive = 0;
                $this->line("sent  {$user->email}");
            } catch (\Throwable $e) {
                $failed[] = $user->email;
                $consecutive++;
                Log::error('Credentials email failed during dedupe', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                $this->error("FAILED {$user->email}: " . $e->getMessage());

                if ($consecutive >= self::MAX_CONSECUTIVE_MAIL_FAILURES) {
                    $aborted = true;
                    foreach (array_slice(array_values($users), $i + 1) as $rest) {
                        $pending[] = $rest->email;
                    }
                    break;
                }
            }

            if ($sync && $spacing > 0) {
                sleep($spacing);
            }
        }

        $this->newLine();
        $this->info("Credentials emails: {$sent} sent, " . count($failed) . ' failed, ' . count($pending) . ' not processed.');

        if (!empty($failed)) {
            $this->warn('These accounts now have a password nobody knows. Set a temporary password for each one in the admin panel (Users > Set password):');
            foreach ($failed as $email) {
                $this->line("  - {$email}");
            }
        }

        if (!empty($pending)) {
            // They were NOT changed. Once the duplicates are gone this command can no longer
            // find them, so handle them from this list (admin panel, or ask them to use
            // "Forgot password").
            $this->warn($aborted
                ? 'Stopped early because emails kept failing. These accounts were NOT given a new password:'
                : 'These accounts were NOT given a new password (the --limit was reached):');
            foreach ($pending as $email) {
                $this->line("  - {$email}");
            }
        }
    }

    private function hasData(User $user): bool
    {
        return $user->studentProfile()->exists()
            || $user->facultyProfile()->exists()
            || $user->appointments()->exists()
            || $user->medicineRequests()->exists()
            || $user->requirements()->exists()
            || $user->surveyAnswers()->exists()
            || $user->walkinLogs()->exists()
            || $user->sentMessages()->exists();
    }
}