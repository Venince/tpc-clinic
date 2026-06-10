<?php
namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Appointment;
use App\Models\MedicineRequest;
use App\Models\SurveyAnswer;
use App\Models\UserRequirement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->load('studentProfile.program');

        return Inertia::render('Student/Dashboard', [
            'profile'              => $user->studentProfile,
            'appointmentCount'     => Appointment::where('user_id', $user->id)->count(),
            'pendingAppointments'  => Appointment::where('user_id', $user->id)->where('status', 'pending')->count(),
            'medicineRequests'     => MedicineRequest::where('user_id', $user->id)->where('status', 'pending')->count(),
            'surveyCompleted'      => SurveyAnswer::where('user_id', $user->id)->exists(),
            'requirementsStatus'   => UserRequirement::where('user_id', $user->id)
                ->select('approval_status', DB::raw('count(*) as total'))
                ->groupBy('approval_status')
                ->pluck('total', 'approval_status'),
            'recentAppointments'   => Appointment::where('user_id', $user->id)->with('slot')->latest()->limit(3)->get(),
            'announcements'        => Announcement::published()->notExpired()->latest('published_at')->limit(3)->get(),
        ]);
    }
}
