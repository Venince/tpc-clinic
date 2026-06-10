<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $announcements = Announcement::published()->notExpired()
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->select('id', 'title', 'content', 'category', 'published_at')
            ->latest('published_at')
            ->paginate(10);

        return response()->json(['data' => $announcements]);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        if (!$announcement->is_published) {
            abort(404);
        }
        return response()->json(['data' => $announcement->only('id', 'title', 'content', 'category', 'published_at')]);
    }
}
