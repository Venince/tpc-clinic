<?php

namespace Tests\Feature\Medicine;

use App\Models\Medicine;
use App\Models\MedicineRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Tests\TestCase;

class MedicineTest extends TestCase
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

    private function createMedicine(array $overrides = []): Medicine
    {
        return Medicine::create(array_merge([
            'name'          => 'Paracetamol 500mg',
            'unit'          => 'tablets',
            'quantity'      => 100,
            'reorder_level' => 10,
            'is_active'     => true,
        ], $overrides));
    }

    public function test_admin_can_add_medicine(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/medicines', [
                'name'          => 'Ibuprofen 200mg',
                'unit'          => 'tablets',
                'quantity'      => 200,
                'reorder_level' => 20,
            ])->assertStatus(201)
            ->assertJsonPath('data.name', 'Ibuprofen 200mg');
    }

    public function test_admin_can_update_medicine(): void
    {
        $medicine = $this->createMedicine();

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/admin/medicines/{$medicine->id}", ['quantity' => 150])
            ->assertOk()
            ->assertJsonPath('data.quantity', 150);
    }

    public function test_admin_can_delete_medicine_with_no_active_requests(): void
    {
        $medicine = $this->createMedicine();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/medicines/{$medicine->id}")
            ->assertOk();

        $this->assertSoftDeleted('medicines', ['id' => $medicine->id]);
    }

    public function test_student_can_request_medicine(): void
    {
        $medicine = $this->createMedicine();

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/medicine-requests', [
                'medicine_id'        => $medicine->id,
                'quantity_requested' => 2,
                'reason'             => 'Headache',
            ])->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_student_cannot_request_out_of_stock_medicine(): void
    {
        $medicine = $this->createMedicine(['quantity' => 0]);

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/medicine-requests', [
                'medicine_id'        => $medicine->id,
                'quantity_requested' => 1,
                'reason'             => 'Fever',
            ])->assertStatus(422);
    }

    public function test_admin_can_approve_medicine_request(): void
    {
        $medicine = $this->createMedicine();
        $request  = MedicineRequest::create([
            'user_id'            => $this->student->id,
            'medicine_id'        => $medicine->id,
            'quantity_requested' => 2,
            'reason'             => 'Headache',
            'status'             => 'pending',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/medicine-requests/{$request->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_admin_can_release_medicine_and_deducts_stock(): void
    {
        $medicine = $this->createMedicine(['quantity' => 50]);
        $request  = MedicineRequest::create([
            'user_id'            => $this->student->id,
            'medicine_id'        => $medicine->id,
            'quantity_requested' => 5,
            'reason'             => 'Pain',
            'status'             => 'approved',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/medicine-requests/{$request->id}/release", [
                'quantity_released' => 5,
            ])->assertOk()
            ->assertJsonPath('data.status', 'released');

        $this->assertEquals(45, $medicine->fresh()->quantity);
    }

    public function test_admin_cannot_release_more_than_stock(): void
    {
        $medicine = $this->createMedicine(['quantity' => 3]);
        $request  = MedicineRequest::create([
            'user_id'            => $this->student->id,
            'medicine_id'        => $medicine->id,
            'quantity_requested' => 10,
            'reason'             => 'Pain',
            'status'             => 'approved',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/medicine-requests/{$request->id}/release", [
                'quantity_released' => 10,
            ])->assertStatus(422);
    }

    public function test_low_stock_endpoint_returns_correct_medicines(): void
    {
        $this->createMedicine(['name' => 'Low Stock Med', 'quantity' => 5, 'reorder_level' => 10]);
        $this->createMedicine(['name' => 'OK Med', 'quantity' => 100, 'reorder_level' => 10]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/medicines/low-stock')
            ->assertOk();

        $names = collect($response->json('data'))->pluck('name');
        $this->assertTrue($names->contains('Low Stock Med'));
        $this->assertFalse($names->contains('OK Med'));
    }
}
