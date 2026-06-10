<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->string('student_id', 20)->unique()->nullable();
            $table->integer('year_level')->nullable();
            $table->string('block', 10)->nullable();
            $table->date('birth_date')->nullable();
            $table->enum('sex', ['male', 'female', 'other'])->nullable();
            $table->string('contact_number', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_contact', 20)->nullable();
            $table->enum('civil_status', ['single', 'married', 'widowed', 'separated'])->default('single');
            $table->boolean('is_pregnant')->default(false);
            $table->date('pregnancy_due_date')->nullable();
            $table->text('medical_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('faculty_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('employee_id', 20)->unique()->nullable();
            $table->string('department')->nullable();
            $table->string('position')->nullable();
            $table->date('birth_date')->nullable();
            $table->enum('sex', ['male', 'female', 'other'])->nullable();
            $table->string('contact_number', 20)->nullable();
            $table->text('address')->nullable();
            $table->enum('civil_status', ['single', 'married', 'widowed', 'separated'])->default('single');
            $table->boolean('is_pregnant')->default(false);
            $table->date('pregnancy_due_date')->nullable();
            $table->text('medical_notes')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('faculty_profiles');
        Schema::dropIfExists('student_profiles');
        Schema::dropIfExists('programs');
    }
};
