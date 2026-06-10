<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditService
{
    public function log(
        string $action,
        ?int $userId = null,
        ?string $modelType = null,
        ?int $modelId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $ipAddress = null,
        ?string $description = null
    ): AuditLog {
        return AuditLog::create([
            'user_id'     => $userId,
            'action'      => $action,
            'model_type'  => $modelType,
            'model_id'    => $modelId,
            'old_values'  => $oldValues,
            'new_values'  => $newValues,
            'ip_address'  => $ipAddress ?? request()->ip(),
            'user_agent'  => request()->userAgent(),
            'description' => $description,
        ]);
    }
}
