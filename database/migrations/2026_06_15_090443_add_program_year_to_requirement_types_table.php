<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('requirement_types', function (Blueprint $table) {
            $table->foreignId('program_id')->nullable()->after('is_required')
                ->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('year_level')->nullable()->after('program_id');
        });
    }

    public function down(): void
    {
        Schema::table('requirement_types', function (Blueprint $table) {
            $table->dropForeign(['program_id']);
            $table->dropColumn(['program_id', 'year_level']);
        });
    }
};