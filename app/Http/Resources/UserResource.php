<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'name'                  => $this->name,
            'email'                 => $this->email,
            'role'                  => $this->whenLoaded('role', fn() => ['name' => $this->role->name, 'display_name' => $this->role->display_name]),
            'is_active'             => $this->is_active,
            'force_password_change' => $this->force_password_change,
            'profile_photo_url'     => $this->profile_photo_url,
            'last_login_at'         => $this->last_login_at,
            'student_profile'       => $this->whenLoaded('studentProfile'),
            'faculty_profile'       => $this->whenLoaded('facultyProfile'),
            'created_at'            => $this->created_at,
        ];
    }
}
