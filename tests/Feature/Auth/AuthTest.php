<?php
namespace Tests\Feature\Auth;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_page_loads(): void
    {
        $this->get(route('login'))->assertStatus(200);
    }

    public function test_admin_can_login(): void
    {
        $this->post(route('login'), ['email'=>'admin@tpc.edu.ph','password'=>'Admin@123'])
            ->assertRedirect(route('admin.dashboard'));
    }

    public function test_wrong_credentials_rejected(): void
    {
        $this->post(route('login'), ['email'=>'admin@tpc.edu.ph','password'=>'WrongPass'])
            ->assertSessionHasErrors('email');
    }

    public function test_student_redirects_to_student_dashboard(): void
    {
        $this->post(route('login'), ['email'=>'student@tpc.edu.ph','password'=>'Student@123'])
            ->assertRedirect(route('student.dashboard'));
    }

    public function test_force_password_change_redirects(): void
    {
        $user = User::where('email','admin@tpc.edu.ph')->first();
        $user->update(['force_password_change'=>true]);
        $this->actingAs($user)->get(route('admin.dashboard'))->assertRedirect(route('password.change'));
    }

    public function test_logout_works(): void
    {
        $user = User::where('email','admin@tpc.edu.ph')->first();
        $this->actingAs($user)->post(route('logout'))->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::where('email','student@tpc.edu.ph')->first();
        $user->update(['is_active'=>false]);
        $this->post(route('login'), ['email'=>$user->email,'password'=>'Student@123'])
            ->assertSessionHasErrors('email');
    }

    public function test_guest_cannot_access_admin_dashboard(): void
    {
        $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
    }

    public function test_student_cannot_access_admin_dashboard(): void
    {
        $student = User::where('email','student@tpc.edu.ph')->first();
        $this->actingAs($student)->get(route('admin.dashboard'))->assertStatus(403);
    }
}
