<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function __construct(private AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $announcements = Announcement::with('creator:id,name')
            ->when($request->category,     fn($q) => $q->where('category', $request->category))
            ->when($request->is_published !== null, fn($q) => $q->where('is_published', $request->boolean('is_published')))
            ->latest()->paginate(20);
        return response()->json(['data' => $announcements]);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        return response()->json(['data' => $announcement->load('creator:id,name')]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'content'      => ['required', 'string'],
            'category'     => ['required', 'in:general,health,event'],
            'is_published' => ['boolean'],
            'published_at' => ['nullable', 'date'],
            'expires_at'   => ['nullable', 'date', 'after:published_at'],
        ]);

        $announcement = Announcement::create(array_merge($data, [
            'created_by'   => $request->user()->id,
            'published_at' => ($data['is_published'] ?? false) ? (isset($data['published_at']) ? $data['published_at'] : now()) : null,
        ]));

        $this->auditService->log('announcement_created', $request->user()->id, 'Announcement', $announcement->id);
        return response()->json(['message' => 'Announcement created.', 'data' => $announcement], 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $data = $request->validate([
            'title'        => ['sometimes', 'string', 'max:255'],
            'content'      => ['sometimes', 'string'],
            'category'     => ['sometimes', 'in:general,health,event'],
            'is_published' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'expires_at'   => ['nullable', 'date'],
        ]);

        $announcement->update($data);
        $this->auditService->log('announcement_updated', $request->user()->id, 'Announcement', $announcement->id);
        return response()->json(['message' => 'Announcement updated.', 'data' => $announcement]);
    }

    public function destroy(Request $request, Announcement $announcement): JsonResponse
    {
        $announcement->delete();
        $this->auditService->log('announcement_deleted', $request->user()->id, 'Announcement', $announcement->id);
        return response()->json(['message' => 'Announcement deleted.']);
    }
}
