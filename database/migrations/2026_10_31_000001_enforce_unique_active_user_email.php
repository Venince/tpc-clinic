<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * OPTIONAL. Run only after reading this.
 *
 * 2026_06_14_135130_update_users_email_unique_index created UNIQUE (email, deleted_at)
 * and described it as "only enforces uniqueness on non-deleted rows". In MySQL that is
 * not true: NULL values are never equal to each other in a unique index, so two ACTIVE
 * users (deleted_at IS NULL) with the same email are NOT rejected. Only the
 * Rule::unique(...)->whereNull('deleted_at') validation prevents it, which two
 * simultaneous requests or any code path without that rule can bypass. With duplicate
 * active emails, sign-in and password reset pick one of the rows arbitrarily, so one
 * person can never get in.
 *
 * This adds a virtual column that holds the email only for non-deleted users and puts
 * a unique index on it. Deleted users keep their email in history without blocking
 * re-registration. Requires MySQL 5.7+/8.0 (your docs say 8.0+); other drivers
 * (e.g. SQLite in tests) are skipped.
 *
 * It refuses to run if duplicate active emails already exist, and tells you which.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $duplicates = DB::table('users')
            ->select('email', DB::raw('COUNT(*) AS total'))
            ->whereNull('deleted_at')
            ->groupBy('email')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        if ($duplicates->isNotEmpty()) {
            $list = $duplicates->map(fn ($row) => "{$row->email} (x{$row->total})")->implode(', ');

            throw new RuntimeException(
                'Cannot add the unique index: these emails belong to more than one active user. '
                . 'Delete or rename the extra accounts, then run this migration again: ' . $list
            );
        }

        if (!Schema::hasColumn('users', 'email_active')) {
            DB::statement(
                'ALTER TABLE users ADD COLUMN email_active VARCHAR(255) '
                . 'GENERATED ALWAYS AS (IF(deleted_at IS NULL, email, NULL)) VIRTUAL'
            );
        }

        DB::statement('CREATE UNIQUE INDEX users_email_active_unique ON users (email_active)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        if (Schema::hasColumn('users', 'email_active')) {
            DB::statement('DROP INDEX users_email_active_unique ON users');
            DB::statement('ALTER TABLE users DROP COLUMN email_active');
        }
    }
};