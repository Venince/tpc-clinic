<?php

namespace Tests\Feature\Admin;

use App\Models\Conversation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessagingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $student;
    private User $faculty;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin   = $this->createUserWithRole('admin');
        $this->student = $this->createUserWithRole('student');
        $this->faculty = $this->createUserWithRole('faculty_staff');
    }

    private function createUserWithRole(string $role): User
    {
        $r = Role::where('name', $role)->firstOrFail();
        return User::factory()->create(['role_id' => $r->id, 'force_password_change' => false, 'is_active' => true]);
    }

    public function test_student_can_start_conversation_with_admin(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/messages/conversations', [
                'recipient_id' => $this->admin->id,
                'subject'      => 'Question about appointment',
                'body'         => 'Hello, I would like to ask about my appointment.',
            ])->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'subject', 'participants']]);

        $this->assertDatabaseHas('conversations', ['subject' => 'Question about appointment']);
    }

    public function test_student_cannot_message_another_student(): void
    {
        $student2 = $this->createUserWithRole('student');

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/messages/conversations', [
                'recipient_id' => $student2->id,
                'subject'      => 'Hi',
                'body'         => 'Hello!',
            ])->assertStatus(422);
    }

    public function test_user_can_reply_to_conversation(): void
    {
        // Start conversation
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/messages/conversations', [
                'recipient_id' => $this->admin->id,
                'subject'      => 'Test subject',
                'body'         => 'First message.',
            ]);

        $conversationId = $response->json('data.id');

        // Admin replies
        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/messages/conversations/{$conversationId}/messages", [
                'body' => 'Thank you for your message.',
            ])->assertStatus(201)
            ->assertJsonPath('data.body', 'Thank you for your message.');
    }

    public function test_user_can_view_their_conversations(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/messages/conversations', [
                'recipient_id' => $this->admin->id,
                'subject'      => 'My question',
                'body'         => 'Need help.',
            ]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/messages/conversations')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_user_can_mark_conversation_as_read(): void
    {
        $response       = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/messages/conversations', [
                'recipient_id' => $this->admin->id,
                'subject'      => 'Mark read test',
                'body'         => 'Hello.',
            ]);
        $conversationId = $response->json('data.id');

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/messages/conversations/{$conversationId}/read")
            ->assertOk();
    }

    public function test_non_participant_cannot_view_conversation(): void
    {
        $response       = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/messages/conversations', [
                'recipient_id' => $this->admin->id,
                'subject'      => 'Private',
                'body'         => 'Secret.',
            ]);
        $conversationId = $response->json('data.id');

        // Faculty is not a participant
        $this->actingAs($this->faculty, 'sanctum')
            ->getJson("/api/v1/messages/conversations/{$conversationId}")
            ->assertStatus(403);
    }

    public function test_faculty_can_message_admin(): void
    {
        $this->actingAs($this->faculty, 'sanctum')
            ->postJson('/api/v1/messages/conversations', [
                'recipient_id' => $this->admin->id,
                'subject'      => 'Faculty inquiry',
                'body'         => 'Hi from faculty.',
            ])->assertStatus(201);
    }
}
