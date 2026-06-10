<?php

namespace App\Services;

use App\Models\RequirementType;
use App\Models\UserRequirement;
use App\Notifications\RequirementStatusNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class RequirementService
{
    public function __construct(private AuditService $auditService) {}

    public function createType(array $data, int $adminId): RequirementType
    {
        $data['sort_order'] = RequirementType::max('sort_order') + 1;
        $type = RequirementType::create($data);
        $this->auditService->log('requirement_type_created', $adminId, 'RequirementType', $type->id);
        return $type;
    }

    public function updateType(RequirementType $type, array $data, int $adminId): RequirementType
    {
        $old = $type->toArray();
        $type->update($data);
        $this->auditService->log('requirement_type_updated', $adminId, 'RequirementType', $type->id, $old, $data);
        return $type->fresh();
    }

    public function deleteType(RequirementType $type, int $adminId): void
    {
        $this->auditService->log('requirement_type_deleted', $adminId, 'RequirementType', $type->id);
        $type->delete();
    }

    public function uploadRequirement(int $userId, int $requirementTypeId, UploadedFile $file): UserRequirement
    {
        $path = $file->store("requirements/{$userId}", 'private');

        $requirement = UserRequirement::updateOrCreate(
            ['user_id' => $userId, 'requirement_type_id' => $requirementTypeId],
            [
                'file_path'           => $path,
                'original_filename'   => $file->getClientOriginalName(),
                'mime_type'           => $file->getMimeType(),
                'file_size'           => $file->getSize(),
                'verification_status' => 'pending',
                'approval_status'     => 'pending',
                'rejection_reason'    => null,
                'reviewed_by'         => null,
                'reviewed_at'         => null,
            ]
        );

        $this->auditService->log('requirement_uploaded', $userId, 'UserRequirement', $requirement->id);
        return $requirement->load('requirementType');
    }

    public function review(UserRequirement $requirement, string $status, int $adminId, ?string $reason = null): UserRequirement
    {
        $old = $requirement->toArray();

        $requirement->update([
            'approval_status'     => $status,
            'verification_status' => $status === 'approved' ? 'verified' : 'rejected',
            'rejection_reason'    => $reason,
            'reviewed_by'         => $adminId,
            'reviewed_at'         => now(),
        ]);

        $requirement->user->notify(new RequirementStatusNotification($requirement));
        $this->auditService->log("requirement_{$status}", $adminId, 'UserRequirement', $requirement->id, $old);
        return $requirement->fresh('requirementType', 'user');
    }

    public function getUserCompletionStatus(int $userId): array
    {
        $types        = RequirementType::where('is_active', true)->get();
        $requirements = UserRequirement::where('user_id', $userId)->get()->keyBy('requirement_type_id');

        return $types->map(function ($type) use ($requirements) {
            $req = $requirements->get($type->id);
            return [
                'requirement_type' => $type,
                'status'           => $req ? $req->approval_status : 'not_uploaded',
                'uploaded_at'      => $req?->created_at,
                'reviewed_at'      => $req?->reviewed_at,
            ];
        })->toArray();
    }
}
