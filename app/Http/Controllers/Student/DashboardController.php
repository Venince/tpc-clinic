<?php
namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Appointment;
use App\Models\MedicineRequest;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use App\Models\UserRequirement;
use App\Models\WalkinLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->load('studentProfile.program');

        $requiredIds = SurveyQuestion::where('is_active', true)
            ->where('is_required', true)
            ->pluck('id');

        $answeredIds = SurveyAnswer::where('user_id', $user->id)
            ->whereIn('survey_question_id', $requiredIds)
            ->whereNotNull('answer')
            ->get()
            ->filter(fn($a) => !empty(array_filter((array) $a->answer, fn($v) => trim($v) !== '')))
            ->pluck('survey_question_id');

        $surveyCompleted = $requiredIds->isEmpty() || $requiredIds->diff($answeredIds)->isEmpty();

        $profile   = $user->studentProfile;
        $profileCompleted = $profile
            && $profile->student_id
            && $profile->program_id
            && $profile->year_level
            && $profile->sex
            && $profile->birth_date
            && $profile->contact_number
            && $profile->address
            && $profile->guardian_name
            && $profile->guardian_contact
            && $profile->civil_status;

        return Inertia::render('Student/Dashboard', [
            'profile'            => $profile,
            'profileCompleted'   => $profileCompleted,
            'surveyCompleted'    => $surveyCompleted,
            'appointmentCount'   => Appointment::where('user_id', $user->id)->count(),
            'pendingAppointments'=> Appointment::where('user_id', $user->id)->where('status', 'pending')->count(),
            'medicineRequests'   => MedicineRequest::where('user_id', $user->id)->where('status', 'pending')->count(),
            'requirementsStatus' => UserRequirement::where('user_id', $user->id)
                ->select('approval_status', DB::raw('count(*) as total'))
                ->groupBy('approval_status')
                ->pluck('total', 'approval_status'),
            'recentAppointments' => Appointment::where('user_id', $user->id)->with('slot')->latest()->limit(3)->get(),
            'announcements'      => Announcement::published()->notExpired()->latest('published_at')->limit(3)->get(),
            'recentWalkins'      => WalkinLog::where('user_id', $user->id)->latest('visited_at')->limit(3)->get(),
            'walkinCount'        => WalkinLog::where('user_id', $user->id)->count(),
        ]);
    }
}
