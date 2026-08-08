<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    /**
     * Save (or update) the browser's push subscription for the logged-in user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'endpoint'      => 'required|string',
            'keys.p256dh'   => 'required|string',
            'keys.auth'     => 'required|string',
        ]);

        $request->user()->updatePushSubscription(
            $request->input('endpoint'),
            $request->input('keys.p256dh'),
            $request->input('keys.auth'),
        );

        return response()->json(['status' => 'subscribed']);
    }

    /**
     * Remove a push subscription (e.g. user disabled notifications, or the
     * browser reports the subscription expired).
     */
    public function destroy(Request $request)
    {
        $request->validate(['endpoint' => 'required|string']);

        $request->user()->deletePushSubscription($request->input('endpoint'));

        return response()->json(['status' => 'unsubscribed']);
    }
}
