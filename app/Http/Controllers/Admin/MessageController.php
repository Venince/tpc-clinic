<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use App\Services\MessagingService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class MessageController extends Controller
{
    public function __construct(private MessagingService $messagingService) {}

    /**
     * Which portal this request is being served through — based on the
     * route prefix, not the user's role. An admin/super_admin can browse
     * their personal Student or Faculty portal, so keying this off role
     * would always resolve to "admin" and bounce them back to the Admin
     * Panel even while they're inside student.* or faculty.* routes.
     */
    private function currentPortal(Request $request): string
    {
        $routeName = $request->route()?->getName() ?? '';
        return match (true) {
            str_starts_with($routeName, 'student.') => 'student',
            str_starts_with($routeName, 'faculty.') => 'faculty',
            default                                 => 'admin',
        };
    }

    private function indexPage(Request $request): string
    {
        return match($this->currentPortal($request)) {
            'student' => 'Student/Messages/Index',
            'faculty' => 'Faculty/Messages/Index',
            default   => 'Admin/Messages/Index',
        };
    }

    private function showPage(Request $request): string
    {
        return match($this->currentPortal($request)) {
            'student' => 'Student/Messages/Show',
            'faculty' => 'Faculty/Messages/Show',
            default   => 'Admin/Messages/Show',
        };
    }

    private function indexRoute(Request $request): string
    {
        return match($this->currentPortal($request)) {
            'student' => 'student.messages.index',
            'faculty' => 'faculty.messages.index',
            default   => 'admin.messages.index',
        };
    }

    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Conversation::visibleFor($userId)
            ->with([
                'participants:id,name,email,profile_photo_path',
                'messages' => fn($q) => $q->latest()->limit(1),
            ])
            ->withCount(['messages as unread' => fn($q) => $q->where('sender_id', '!=', $userId)->where('is_read', false)])
            ->orderByDesc('last_message_at')->paginate(20);

        $user = $request->user();
        if ($user->isAdminOrHigher()) {
            $contacts = User::where('id', '!=', $user->id)
                ->whereHas('role', fn($q) => $q->whereIn('name', ['student', 'faculty_staff', 'admin', 'super_admin']))
                ->select('id', 'name', 'email', 'profile_photo_path')
                ->get();
        } else {
            $contacts = User::whereHas('role', fn($q) => $q->whereIn('name', ['admin', 'super_admin']))
                ->select('id', 'name', 'email', 'profile_photo_path')
                ->get();
        }

        return Inertia::render($this->indexPage($request), compact('conversations', 'contacts'));
    }

    public function show(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        $participant = $conversation->participants()->where('user_id', $user->id)->first();

        if (!$user->isAdminOrHigher()) {
            if (!$participant) {
                abort(403);
            }
        }

        // A conversation the user has deleted from their own inbox stays hidden
        // for them permanently, even if they try to hit the URL directly.
        if ($participant && $participant->pivot->deleted_at) {
            abort(404);
        }

        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->update(['is_read' => true, 'read_at' => now()]);

        $messages = $this->messagingService->getVisibleMessages($conversation, $user->id);

        return Inertia::render($this->showPage($request), [
            'conversation' => $conversation->load('participants:id,name,email,profile_photo_path'),
            'messages'     => $messages,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'recipient_id' => ['required', 'exists:users,id'],
            'body'         => ['required', 'string'],
        ]);

        $conversation = $this->messagingService->startConversation(
            $request->user()->id,
            (int) $data['recipient_id'],
            $data['body']
        );

        $route = match($this->currentPortal($request)) {
            'student' => 'student.messages.show',
            'faculty' => 'faculty.messages.show',
            default   => 'admin.messages.show',
        };

        return redirect()->route($route, $conversation)->with('success', 'Message sent.');
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

        // Route through the service (not a raw Message::create) so this reply
        // gets the same treatment as every other message: notifications, the
        // conversation's last_message_at bump, and the delete/watermark rules.
        $this->messagingService->addMessage($conversation, $user->id, $request->body);

        return back()->with('success', 'Reply sent.');
    }

    /**
     * Delete the ENTIRE conversation, but only from the current user's inbox.
     * The other participant keeps the conversation and all its messages
     * untouched, unless they too have already deleted it — in which case
     * nobody can see it anymore and it's permanently purged.
     */
    public function destroy(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if (!$user->isAdminOrHigher()) {
            if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
                abort(403);
            }
        }

        $this->messagingService->deleteConversationForUser($conversation, $user->id);

        return redirect()->route($this->indexRoute($request))->with('success', 'Conversation deleted.');
    }

    /**
     * Delete one or more selected messages inside a conversation.
     * mode = "me"       -> hides the selected messages only for the current user.
     * mode = "everyone" -> removes the selected messages for all participants;
     *                      only allowed when every selected message was sent
     *                      by the current user.
     */
    public function destroyMessages(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if (!$user->isAdminOrHigher()) {
            if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
                abort(403);
            }
        }

        $data = $request->validate([
            'message_ids'   => ['required', 'array', 'min:1'],
            'message_ids.*' => ['integer', 'exists:messages,id'],
            'mode'          => ['required', 'in:me,everyone'],
        ]);

        $messages = Message::where('conversation_id', $conversation->id)
            ->whereIn('id', $data['message_ids'])
            ->get();

        if ($data['mode'] === 'everyone') {
            $notOwned = $messages->contains(fn($m) => (int) $m->sender_id !== $user->id);
            if ($notOwned) {
                throw ValidationException::withMessages([
                    'message_ids' => ['You can only delete your own messages for everyone.'],
                ]);
            }
        }

        foreach ($messages as $message) {
            if ($data['mode'] === 'everyone') {
                $this->messagingService->deleteMessageForEveryone($message, $user->id);
            } else {
                $this->messagingService->deleteMessageForUser($message, $user->id);
            }
        }

        return back()->with('success', $data['mode'] === 'everyone'
            ? 'Message(s) deleted for everyone.'
            : 'Message(s) deleted for you.');
    }
}