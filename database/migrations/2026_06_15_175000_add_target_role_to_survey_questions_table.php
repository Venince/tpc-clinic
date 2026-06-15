<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            $table->enum('target_role', ['student', 'faculty_staff'])
                ->default('student')
                ->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            $table->dropColumn('target_role');
        });
    }
};