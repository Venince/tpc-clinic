<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\User;
use App\Notifications\AnnouncementNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class AnnouncementController extends Controller {
    public function index(Request $request) {
        return Inertia::render('Admin/Announcements/Index', ['announcements' => Announcement::with('creator:id,name')->latest()->paginate(15)->withQueryString()]);
    }
    public function store(Request $request) {
        $data = $request->validate(['title'=>['required','string','max:255'],'content'=>['required','string'],'category'=>['required','in:general,health,event'],'is_published'=>['boolean'],'expires_at'=>['nullable','date']]);
        $isPublished = $data['is_published'] ?? false;

        $announcement = Announcement::create(array_merge($data,['created_by'=>$request->user()->id,'published_at'=>$isPublished?now():null]));

        if ($isPublished) {
            $this->notifyUsers($announcement, $request->user()->id);
        }

        return back()->with('success','Announcement created.');
    }
    public function update(Request $request, Announcement $announcement) {
        $data = $request->validate(['title'=>['required','string','max:255'],'content'=>['required','string'],'category'=>['required','in:general,health,event'],'is_published'=>['boolean'],'expires_at'=>['nullable','date']]);

        $newlyPublished = ($data['is_published']??false) && !$announcement->published_at;
        if($newlyPublished) $data['published_at'] = now();

        $announcement->update($data);

        if ($newlyPublished) {
            $this->notifyUsers($announcement, $request->user()->id);
        }

        return back()->with('success','Announcement updated.');
    }
    public function destroy(Announcement $announcement) { $announcement->delete(); return back()->with('success','Announcement deleted.'); }

    /**
     * Notify every active user (except whoever just published it) that a
     * new announcement is live — database + real-time + browser push.
     */
    protected function notifyUsers(Announcement $announcement, int $excludeUserId): void
    {
        Notification::send(
            User::where('is_active', true)->where('id', '!=', $excludeUserId)->get(),
            new AnnouncementNotification($announcement)
        );
    }
}
