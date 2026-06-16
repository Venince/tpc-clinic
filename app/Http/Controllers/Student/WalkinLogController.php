<?php

namespace App\Http\Controllers\Student;

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

        return Inertia::render('Student/WalkinLog/Index', [
            'logs'      => $logs,
            // Pass the highlight ID through so the page can auto-expand & scroll
            'highlight' => $request->query('highlight'),
        ]);
    }
}