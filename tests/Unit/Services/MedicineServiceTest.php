<?php

namespace Tests\Unit\Services;

use App\Models\Medicine;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use App\Services\MedicineService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class MedicineServiceTest extends TestCase
{
    use RefreshDatabase;

    private MedicineService $service;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new MedicineService(new AuditService());
        $role          = Role::where('name', 'admin')->firstOrFail();
        $this->admin   = User::factory()->create(['role_id' => $role->id, 'force_password_change' => false]);
    }

    public function test_create_medicine(): void
    {
        $medicine = $this->service->create([
            'name'          => 'Test Medicine',
            'unit'          => 'tablets',
            'quantity'      => 50,
            'reorder_level' => 5,
        ], $this->admin->id);

        $this->assertInstanceOf(Medicine::class, $medicine);
        $this->assertEquals('Test Medicine', $medicine->name);
        $this->assertEquals(50, $medicine->quantity);
    }

    public function test_is_low_stock_detection(): void
    {
        $medicine = Medicine::create([
            'name' => 'Low Med', 'unit' => 'pcs',
            'quantity' => 5, 'reorder_level' => 10, 'is_active' => true,
        ]);

        $this->assertTrue($medicine->isLowStock());
        $this->assertFalse($medicine->isOutOfStock());
    }

    public function test_is_out_of_stock_detection(): void
    {
        $medicine = Medicine::create([
            'name' => 'Empty Med', 'unit' => 'pcs',
            'quantity' => 0, 'reorder_level' => 10, 'is_active' => true,
        ]);

        $this->assertTrue($medicine->isOutOfStock());
        $this->assertFalse($medicine->isLowStock());
    }

    public function test_cannot_request_out_of_stock_medicine(): void
    {
        $studentRole = Role::where('name', 'student')->firstOrFail();
        $student     = User::factory()->create(['role_id' => $studentRole->id]);

        $medicine = Medicine::create([
            'name' => 'Empty', 'unit' => 'pcs',
            'quantity' => 0, 'reorder_level' => 5, 'is_active' => true,
        ]);

        $this->expectException(ValidationException::class);

        $this->service->requestMedicine([
            'medicine_id'        => $medicine->id,
            'quantity_requested' => 1,
            'reason'             => 'Test',
        ], $student->id);
    }

    public function test_get_low_stock_medicines(): void
    {
        Medicine::create(['name' => 'Low', 'unit' => 'pcs', 'quantity' => 3, 'reorder_level' => 10, 'is_active' => true]);
        Medicine::create(['name' => 'OK',  'unit' => 'pcs', 'quantity' => 100, 'reorder_level' => 10, 'is_active' => true]);
        Medicine::create(['name' => 'Out', 'unit' => 'pcs', 'quantity' => 0, 'reorder_level' => 5, 'is_active' => true]);

        $lowStock = $this->service->getLowStockMedicines();
        $this->assertCount(1, $lowStock);
        $this->assertEquals('Low', $lowStock->first()->name);
    }
}
