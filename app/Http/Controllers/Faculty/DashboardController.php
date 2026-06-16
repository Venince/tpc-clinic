<?php
namespace App\Http\Controllers\Faculty;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Appointment;
use App\Models\MedicineRequest;
use App\Models\WalkinLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->load('facultyProfile');

        return Inertia::render('Faculty/Dashboard', [
            'profile'             => $user->facultyProfile,
            'pendingAppointments' => Appointment::where('user_id', $user->id)->where('status', 'pending')->count(),
            'medicineRequests'    => MedicineRequest::where('user_id', $user->id)->where('status', 'pending')->count(),
            'recentAppointments'  => Appointment::where('user_id', $user->id)->with('slot')->latest()->limit(3)->get(),
            'announcements'       => Announcement::published()->notExpired()->latest('published_at')->limit(3)->get(),
            'recentWalkins'       => WalkinLog::where('user_id', $user->id)->latest('visited_at')->limit(3)->get(),
            'walkinCount'         => WalkinLog::where('user_id', $user->id)->count(),
        ]);
    }
}