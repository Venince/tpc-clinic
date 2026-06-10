<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\MessagingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(private MessagingService $messagingService) {}

    public function conversations(Request $request): JsonResponse
    {
        $conversations = $this->messagingService->getUserConversations($request->user()->id);
        return response()->json(['data' => $conversations]);
    }

    public function showConversation(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request->user()->id, $conversation);
        $this->messagingService->markAsRead($conversation, $request->user()->id);

        $messages = Message::where('conversation_id', $conversation->id)
            ->with('sender:id,name,email')
            ->latest()->paginate(50);

        return response()->json([
            'conversation' => $conversation->load('participants:id,name,email'),
            'messages'     => $messages,
        ]);
    }

    public function startConversation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id', 'different:' . $request->user()->id],
            'subject'      => ['required', 'string', 'max:255'],
            'body'         => ['required', 'string'],
        ]);

        $conversation = $this->messagingService->startConversation(
            $request->user()->id,
            $data['recipient_id'],
            $data['subject'],
            $data['body'],
            $request->hasFile('attachments') ? $request->file('attachments') : []
        );

        return response()->json(['message' => 'Conversation started.', 'data' => $conversation], 201);
    }

    public function sendMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request->user()->id, $conversation);

        $data = $request->validate([
            'body'          => ['required', 'string'],
            'attachments'   => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,doc,docx'],
        ]);

        $message = $this->messagingService->addMessage(
            $conversation,
            $request->user()->id,
            $data['body'],
            $request->hasFile('attachments') ? $request->file('attachments') : []
        );

        return response()->json(['message' => 'Message sent.', 'data' => $message], 201);
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request->user()->id, $conversation);
        $this->messagingService->markAsRead($conversation, $request->user()->id);
        return response()->json(['message' => 'Messages marked as read.']);
    }

    private function authorizeParticipant(int $userId, Conversation $conversation): void
    {
        if (!$conversation->participants()->where('user_id', $userId)->exists()) {
            abort(403, 'You are not a participant in this conversation.');
        }
    }
}
