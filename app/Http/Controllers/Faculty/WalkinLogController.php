<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalkinLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = $request->user()
            ->walkinLogs()
            ->with('loggedBy:id,name')
            ->latest('visited_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Faculty/WalkinLog/Index', [
            'logs'      => $logs,
            'highlight' => $request->query('highlight'),
        ]);
    }
}