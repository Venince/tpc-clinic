<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Blank out the old free-text `block` values (e.g. "Block 1", "B1", "1")
     * so every student starts uniform under the new dropdown-based block
     * selection. They'll be prompted to re-select their block on next login.
     */
    public function up(): void
    {
        DB::table('student_profiles')->update(['block' => null]);
    }

    /**
     * Not reversible — the original free-text values are not preserved,
     * since the whole point is to discard the inconsistent data.
     */
    public function down(): void
    {
        // Intentionally left blank.
    }
};