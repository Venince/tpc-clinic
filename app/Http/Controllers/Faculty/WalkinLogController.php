<?php
namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\WalkinLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalkinLogController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Faculty/WalkinLog/Index', [
            'logs' => WalkinLog::where('user_id', $request->user()->id)
                ->with('loggedBy:id,name')
                ->latest('visited_at')
                ->paginate(15),
        ]);
    }
}