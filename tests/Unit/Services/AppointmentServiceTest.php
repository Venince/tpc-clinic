<?php

namespace Tests\Unit\Services;

use App\Models\Appointment;
use App\Models\AppointmentSlot;
use App\Models\Role;
use App\Models\User;
use App\Repositories\Eloquent\AppointmentRepository;
use App\Services\AppointmentService;
use App\Services\AuditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AppointmentServiceTest extends TestCase
{
    use RefreshDatabase;

    private AppointmentService $service;
    private User $admin;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AppointmentService(new AppointmentRepository(), new AuditService());
        $this->admin   = User::factory()->create(['role_id' => Role::where('name', 'admin')->first()->id,   'force_password_change' => false]);
        $this->student = User::factory()->create(['role_id' => Role::where('name', 'student')->first()->id, 'force_password_change' => false]);
    }

    private function makeSlot(array $overrides = []): AppointmentSlot
    {
        return AppointmentSlot::create(array_merge([
            'created_by'       => $this->admin->id,
            'date'             => now()->addDays(5)->toDateString(),
            'start_time'       => '09:00',
            'end_time'         => '10:00',
            'max_appointments' => 3,
            'booked_count'     => 0,
            'is_available'     => true,
        ], $overrides));
    }

    public function test_admin_can_create_slot(): void
    {
        $slot = $this->service->createSlot([
            'date'             => now()->addDays(3)->toDateString(),
            'start_time'       => '10:00',
            'end_time'         => '11:00',
            'max_appointments' => 2,
        ], $this->admin->id);

        $this->assertInstanceOf(AppointmentSlot::class, $slot);
        $this->assertEquals(2, $slot->max_appointments);
    }

    public function test_booking_increments_booked_count(): void
    {
        $slot        = $this->makeSlot();
        $initialCount = $slot->booked_count;

        $this->service->book([
            'appointment_slot_id' => $slot->id,
            'purpose'             => 'Check-up',
        ], $this->student->id);

        $this->assertEquals($initialCount + 1, $slot->fresh()->booked_count);
    }

    public function test_fully_booked_slot_becomes_unavailable(): void
    {
        $slot = $this->makeSlot(['max_appointments' => 1]);

        $this->service->book([
            'appointment_slot_id' => $slot->id,
            'purpose'             => 'Check-up',
        ], $this->student->id);

        $this->assertFalse($slot->fresh()->is_available);
    }

    public function test_cannot_book_unavailable_slot(): void
    {
        $slot = $this->makeSlot(['is_available' => false]);

        $this->expectException(ValidationException::class);
        $this->service->book(['appointment_slot_id' => $slot->id, 'purpose' => 'Test'], $this->student->id);
    }

    public function test_declining_appointment_frees_slot(): void
    {
        $slot        = $this->makeSlot(['max_appointments' => 1]);
        $appointment = $this->service->book(['appointment_slot_id' => $slot->id, 'purpose' => 'Test'], $this->student->id);

        $this->assertFalse($slot->fresh()->is_available);

        $this->service->updateStatus($appointment, 'declined', $this->admin->id, 'Slot conflict');

        $this->assertTrue($slot->fresh()->is_available);
        $this->assertEquals(0, $slot->fresh()->booked_count);
    }

    public function test_get_stats_returns_correct_counts(): void
    {
        $slot = $this->makeSlot(['max_appointments' => 5]);
        $this->service->book(['appointment_slot_id' => $slot->id, 'purpose' => 'P1'], $this->student->id);

        $stats = $this->service->getStats();

        $this->assertArrayHasKey('total',     $stats);
        $this->assertArrayHasKey('pending',   $stats);
        $this->assertArrayHasKey('approved',  $stats);
        $this->assertArrayHasKey('declined',  $stats);
        $this->assertArrayHasKey('completed', $stats);
        $this->assertGreaterThanOrEqual(1, $stats['total']);
        $this->assertEquals(1, $stats['pending']);
    }

    public function test_cannot_delete_slot_with_active_appointments(): void
    {
        $slot = $this->makeSlot();
        $this->service->book(['appointment_slot_id' => $slot->id, 'purpose' => 'Test'], $this->student->id);

        $this->expectException(ValidationException::class);
        $this->service->deleteSlot($slot, $this->admin->id);
    }
}
