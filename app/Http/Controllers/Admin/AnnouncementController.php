<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnouncementController extends Controller {
    public function index(Request $request) {
        return Inertia::render('Admin/Announcements/Index', ['announcements' => Announcement::with('creator:id,name')->latest()->paginate(15)->withQueryString()]);
    }
    public function store(Request $request) {
        $data = $request->validate(['title'=>['required','string','max:255'],'content'=>['required','string'],'category'=>['required','in:general,health,event'],'is_published'=>['boolean'],'expires_at'=>['nullable','date']]);
        Announcement::create(array_merge($data,['created_by'=>$request->user()->id,'published_at'=>($data['is_published']??false)?now():null]));
        return back()->with('success','Announcement created.');
    }
    public function update(Request $request, Announcement $announcement) {
        $data = $request->validate(['title'=>['required','string','max:255'],'content'=>['required','string'],'category'=>['required','in:general,health,event'],'is_published'=>['boolean'],'expires_at'=>['nullable','date']]);
        if(($data['is_published']??false) && !$announcement->published_at) $data['published_at'] = now();
        $announcement->update($data);
        return back()->with('success','Announcement updated.');
    }
    public function destroy(Announcement $announcement) { $announcement->delete(); return back()->with('success','Announcement deleted.'); }
}
