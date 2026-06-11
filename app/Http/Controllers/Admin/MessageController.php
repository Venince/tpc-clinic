<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MessageController extends Controller
{
    private function indexPage(Request $request): string
    {
        return match($request->user()->role->name) {
            'student'       => 'Student/Messages/Index',
            'faculty_staff' => 'Faculty/Messages/Index',
            default         => 'Admin/Messages/Index',
        };
    }

    private function showPage(Request $request): string
    {
        return match($request->user()->role->name) {
            'student'       => 'Student/Messages/Show',
            'faculty_staff' => 'Faculty/Messages/Show',
            default         => 'Admin/Messages/Show',
        };
    }

    public function index(Request $request)
    {
        $conversations = Conversation::whereHas('participants', fn($q)=>$q->where('user_id',$request->user()->id))
            ->with(['participants:id,name,email','messages'=>fn($q)=>$q->latest()->limit(1)])
            ->withCount(['messages as unread'=>fn($q)=>$q->where('sender_id','!=',$request->user()->id)->where('is_read',false)])
            ->orderByDesc('last_message_at')->paginate(20);

        $user = $request->user();
        if ($user->isAdminOrHigher()) {
            $contacts = User::where('id','!=',$user->id)->whereHas('role',fn($q)=>$q->whereIn('name',['student','faculty_staff','admin','super_admin']))->select('id','name','email')->get();
        } else {
            $contacts = User::whereHas('role',fn($q)=>$q->whereIn('name',['admin','super_admin']))->select('id','name','email')->get();
        }

        return Inertia::render($this->indexPage($request), compact('conversations','contacts'));
    }

    public function show(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if (!$user->isAdminOrHigher()) {
            if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
                abort(403);
            }
        }

        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->update(['is_read' => true, 'read_at' => now()]);

        $messages = Message::where('conversation_id', $conversation->id)
            ->with('sender:id,name')->latest()->paginate(50);

        return Inertia::render($this->showPage($request), [
            'conversation' => $conversation->load('participants:id,name,email'),
            'messages'     => $messages,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'recipient_id' => ['required','exists:users,id'],
            'subject'      => ['required','string','max:255'],
            'body'         => ['required','string'],
        ]);

        $conversation = Conversation::create(['subject'=>$data['subject'],'last_message_at'=>now()]);
        $conversation->participants()->attach([$request->user()->id,$data['recipient_id']]);
        $msg = Message::create(['conversation_id'=>$conversation->id,'sender_id'=>$request->user()->id,'body'=>$data['body']]);

        User::find($data['recipient_id'])->notify(new NewMessageNotification($msg->load('sender')));

        $role = $request->user()->role->name;
        $route = match($role) {
            'student'       => 'student.messages.show',
            'faculty_staff' => 'faculty.messages.show',
            default         => 'admin.messages.show',
        };

        return redirect()->route($route, $conversation)->with('success','Message sent.');
    }

    public function reply(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if (!$user->isAdminOrHigher()) {
            if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
                abort(403);
            }
        }

        $request->validate(['body' => ['required', 'string']]);

        $msg = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $user->id,
            'body'            => $request->body,
        ]);
        $conversation->update(['last_message_at' => now()]);

        $conversation->participants()
            ->where('user_id', '!=', $user->id)
            ->get()
            ->each(fn($u) => $u->notify(new NewMessageNotification($msg->load('sender'))));

        return back()->with('success', 'Reply sent.');
    }

    public function destroy(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if (!$user->isAdminOrHigher()) {
            if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
                abort(403);
            }
        }

        // Delete all NewMessageNotifications tied to this conversation
        // for every participant, before removing the conversation itself.
        DB::table('notifications')
            ->where('type', NewMessageNotification::class)
            ->where(
                DB::raw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.conversation_id'))"),
                $conversation->id
            )
            ->delete();

        $conversation->messages()->delete();
        $conversation->participants()->detach();
        $conversation->delete();

        $route = match($user->role->name) {
            'student'       => 'student.messages.index',
            'faculty_staff' => 'faculty.messages.index',
            default         => 'admin.messages.index',
        };

        return redirect()->route($route)->with('success', 'Conversation deleted.');
    }
}
