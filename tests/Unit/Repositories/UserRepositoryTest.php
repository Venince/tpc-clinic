<?php

namespace Tests\Unit\Repositories;

use App\Models\Role;
use App\Models\User;
use App\Repositories\Eloquent\UserRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private UserRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new UserRepository();
    }

    private function makeUser(string $role = 'student'): User
    {
        $r = Role::where('name', $role)->firstOrFail();
        return User::factory()->create(['role_id' => $r->id, 'force_password_change' => false]);
    }

    public function test_find_by_email(): void
    {
        $user = $this->makeUser();
        $found = $this->repository->findByEmail($user->email);

        $this->assertNotNull($found);
        $this->assertEquals($user->id, $found->id);
        $this->assertTrue($found->relationLoaded('role'));
    }

    public function test_find_by_email_returns_null_for_nonexistent(): void
    {
        $result = $this->repository->findByEmail('nobody@tpc.edu.ph');
        $this->assertNull($result);
    }

    public function test_find_by_id(): void
    {
        $user  = $this->makeUser();
        $found = $this->repository->findById($user->id);

        $this->assertNotNull($found);
        $this->assertEquals($user->email, $found->email);
    }

    public function test_paginate_filters_by_role(): void
    {
        $this->makeUser('student');
        $this->makeUser('faculty_staff');

        $students = $this->repository->paginate(['role' => 'student']);
        $this->assertEquals(1, $students->total());
    }

    public function test_paginate_filters_by_search(): void
    {
        User::factory()->create(['role_id' => Role::where('name', 'student')->first()->id, 'name' => 'Juan dela Cruz', 'email' => 'juan@tpc.edu.ph']);
        User::factory()->create(['role_id' => Role::where('name', 'student')->first()->id, 'name' => 'Maria Santos',   'email' => 'maria@tpc.edu.ph']);

        $results = $this->repository->paginate(['search' => 'Juan']);
        $this->assertEquals(1, $results->total());
        $this->assertEquals('Juan dela Cruz', $results->items()[0]->name);
    }

    public function test_create_user(): void
    {
        $role = Role::where('name', 'student')->first();
        $user = $this->repository->create([
            'role_id'  => $role->id,
            'name'     => 'New Student',
            'email'    => 'newstudent@tpc.edu.ph',
            'password' => bcrypt('password'),
        ]);

        $this->assertInstanceOf(User::class, $user);
        $this->assertDatabaseHas('users', ['email' => 'newstudent@tpc.edu.ph']);
    }

    public function test_update_user(): void
    {
        $user    = $this->makeUser();
        $updated = $this->repository->update($user, ['name' => 'Updated Name']);

        $this->assertEquals('Updated Name', $updated->name);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Updated Name']);
    }

    public function test_delete_user_soft_deletes(): void
    {
        $user = $this->makeUser();
        $this->repository->delete($user);

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_paginate_active_filter(): void
    {
        $this->makeUser('student');
        User::factory()->create(['role_id' => Role::where('name', 'student')->first()->id, 'is_active' => false]);

        $activeUsers = $this->repository->paginate(['is_active' => true]);
        foreach ($activeUsers->items() as $u) {
            $this->assertTrue($u->is_active);
        }
    }
}
