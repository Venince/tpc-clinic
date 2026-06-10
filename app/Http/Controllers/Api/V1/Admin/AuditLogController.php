<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // SuperAdmin only - enforced at route level
        $logs = AuditLog::with('user:id,name,email')
            ->when($request->user_id,    fn($q) => $q->where('user_id', $request->user_id))
            ->when($request->action,     fn($q) => $q->where('action', $request->action))
            ->when($request->model_type, fn($q) => $q->where('model_type', $request->model_type))
            ->when($request->date_from,  fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to,    fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->latest()
            ->paginate(50);

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
            ],
        ]);
    }

    public function show(AuditLog $auditLog): JsonResponse
    {
        return response()->json(['data' => $auditLog->load('user:id,name,email')]);
    }
}
