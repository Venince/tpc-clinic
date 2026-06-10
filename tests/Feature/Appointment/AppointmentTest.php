<?php

namespace Tests\Feature\Appointment;

use App\Models\Appointment;
use App\Models\AppointmentSlot;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin   = $this->createUserWithRole('admin');
        $this->student = $this->createUserWithRole('student');
    }

    private function createUserWithRole(string $role): User
    {
        $r = Role::where('name', $role)->firstOrFail();
        return User::factory()->create(['role_id' => $r->id, 'force_password_change' => false, 'is_active' => true]);
    }

    private function createSlot(array $overrides = []): AppointmentSlot
    {
        return AppointmentSlot::create(array_merge([
            'created_by'       => $this->admin->id,
            'date'             => now()->addDays(3)->toDateString(),
            'start_time'       => '09:00',
            'end_time'         => '10:00',
            'max_appointments' => 3,
            'booked_count'     => 0,
            'is_available'     => true,
        ], $overrides));
    }

    public function test_admin_can_create_appointment_slot(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/appointment-slots', [
                'date'             => now()->addDays(5)->toDateString(),
                'start_time'       => '10:00',
                'end_time'         => '11:00',
                'max_appointments' => 2,
            ])->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'date', 'start_time', 'end_time']]);
    }

    public function test_student_cannot_create_appointment_slot(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/admin/appointment-slots', [
                'date'             => now()->addDays(5)->toDateString(),
                'start_time'       => '10:00',
                'end_time'         => '11:00',
                'max_appointments' => 2,
            ])->assertStatus(403);
    }

    public function test_student_can_book_appointment(): void
    {
        $slot = $this->createSlot();

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/appointments', [
                'appointment_slot_id' => $slot->id,
                'purpose'             => 'General Check-up',
            ])->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('appointments', [
            'user_id'             => $this->student->id,
            'appointment_slot_id' => $slot->id,
            'status'              => 'pending',
        ]);
    }

    public function test_student_cannot_double_book_same_slot(): void
    {
        $slot = $this->createSlot();

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/appointments', [
                'appointment_slot_id' => $slot->id,
                'purpose'             => 'First booking',
            ])->assertStatus(201);

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/appointments', [
                'appointment_slot_id' => $slot->id,
                'purpose'             => 'Second booking',
            ])->assertStatus(422);
    }

    public function test_slot_becomes_unavailable_when_fully_booked(): void
    {
        $slot = $this->createSlot(['max_appointments' => 1]);

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/appointments', [
                'appointment_slot_id' => $slot->id,
                'purpose'             => 'Check-up',
            ])->assertStatus(201);

        $this->assertFalse($slot->fresh()->is_available);
    }

    public function test_admin_can_approve_appointment(): void
    {
        $slot        = $this->createSlot();
        $appointment = Appointment::create([
            'user_id'             => $this->student->id,
            'appointment_slot_id' => $slot->id,
            'purpose'             => 'Check-up',
            'status'              => 'pending',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/appointments/{$appointment->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_admin_can_decline_appointment_with_reason(): void
    {
        $slot        = $this->createSlot();
        $appointment = Appointment::create([
            'user_id'             => $this->student->id,
            'appointment_slot_id' => $slot->id,
            'purpose'             => 'Check-up',
            'status'              => 'pending',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/appointments/{$appointment->id}/decline", [
                'reason' => 'Slot no longer available.',
            ])->assertOk()
            ->assertJsonPath('data.status', 'declined');
    }

    public function test_student_can_cancel_pending_appointment(): void
    {
        $slot        = $this->createSlot();
        $appointment = Appointment::create([
            'user_id'             => $this->student->id,
            'appointment_slot_id' => $slot->id,
            'purpose'             => 'Check-up',
            'status'              => 'pending',
        ]);

        $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/v1/student/appointments/{$appointment->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_admin_can_view_appointment_calendar(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/appointments/calendar?month=' . now()->format('Y-m'))
            ->assertOk();
    }

    public function test_admin_can_view_appointment_stats(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/appointments/stats')
            ->assertOk()
            ->assertJsonStructure(['data' => ['total', 'pending', 'approved', 'declined', 'completed']]);
    }
}
