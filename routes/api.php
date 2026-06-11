<?php

use App\Http\Controllers\Api\V1\Admin\AnnouncementController as AdminAnnouncementController;
use App\Http\Controllers\Api\V1\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\MessageController as AdminMessageController;
use App\Http\Controllers\Api\V1\Admin\MedicineController as AdminMedicineController;
use App\Http\Controllers\Api\V1\Admin\ProgramController;
use App\Http\Controllers\Api\V1\Admin\ReportController;
use App\Http\Controllers\Api\V1\Admin\RequirementController as AdminRequirementController;
use App\Http\Controllers\Api\V1\Admin\SurveyController as AdminSurveyController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Public\AnnouncementController as PublicAnnouncementController;
use App\Http\Controllers\Api\V1\Public\ContactController;
use App\Http\Controllers\Api\V1\Student\AppointmentController as StudentAppointmentController;
use App\Http\Controllers\Api\V1\Student\MedicineController as StudentMedicineController;
use App\Http\Controllers\Api\V1\Student\ProfileController as StudentProfileController;
use App\Http\Controllers\Api\V1\Student\RequirementController as StudentRequirementController;
use App\Http\Controllers\Api\V1\Student\SurveyController as StudentSurveyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| TPC Clinic API Routes v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ==========================================
    // PUBLIC ROUTES (No authentication required)
    // ==========================================
    Route::prefix('public')->group(function () {
        Route::get('announcements', [PublicAnnouncementController::class, 'index']);
        Route::get('announcements/{announcement}', [PublicAnnouncementController::class, 'show']);
        Route::post('contact', [ContactController::class, 'send'])->middleware('throttle:10,1');
    });

    // ==========================================
    // AUTHENTICATION ROUTES
    // ==========================================
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1')->name('auth.login');
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
        Route::post('reset-password', [AuthController::class, 'resetPassword']);

        Route::middleware(['auth:sanctum', 'active'])->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('change-password', [AuthController::class, 'changePassword'])->name('auth.change-password');
        });
    });

    // ==========================================
    // AUTHENTICATED ROUTES
    // ==========================================
    Route::middleware(['auth:sanctum', 'active', 'password.changed'])->group(function () {

        // Notifications (all roles)
        Route::get('notifications', fn(Request $req) => response()->json(['data' => $req->user()->notifications()->paginate(20)]));
        Route::post('notifications/{id}/read', fn(Request $req, $id) => tap($req->user()->notifications()->find($id)?->markAsRead(), fn() => response()->json(['message' => 'Marked as read.'])));
        Route::post('notifications/read-all', fn(Request $req) => tap($req->user()->unreadNotifications->markAsRead(), fn() => response()->json(['message' => 'All marked as read.'])));

        // ==========================================
        // STUDENT ROUTES
        // ==========================================
        Route::prefix('student')->middleware('role:student')->group(function () {
            // Profile
            Route::get('profile', [StudentProfileController::class, 'show']);
            Route::put('profile', [StudentProfileController::class, 'update']);
            Route::post('profile/photo',   [\App\Http\Controllers\Api\V1\ProfilePhotoController::class, 'upload']);
            Route::delete('profile/photo', [\App\Http\Controllers\Api\V1\ProfilePhotoController::class, 'destroy']);

            // Appointments
            Route::get('appointments', [StudentAppointmentController::class, 'index']);
            Route::post('appointments', [StudentAppointmentController::class, 'store']);
            Route::post('appointments/{appointment}/cancel', [StudentAppointmentController::class, 'cancel']);
            Route::get('appointment-slots', [StudentAppointmentController::class, 'availableSlots']);

            // Medicine
            Route::get('medicines', [StudentMedicineController::class, 'available']);
            Route::get('medicine-requests', [StudentMedicineController::class, 'myRequests']);
            Route::post('medicine-requests', [StudentMedicineController::class, 'request']);

            // Survey
            Route::get('survey/questions', [StudentSurveyController::class, 'questions']);
            Route::get('survey/my-answers', [StudentSurveyController::class, 'myAnswers']);
            Route::post('survey/submit', [StudentSurveyController::class, 'submit']);

            // Requirements
            Route::get('requirements', [StudentRequirementController::class, 'myStatus']);
            Route::post('requirements/upload', [StudentRequirementController::class, 'upload']);
        });

        // ==========================================
        // FACULTY ROUTES (mirror student for most features)
        // ==========================================
        Route::prefix('faculty')->middleware('role:faculty_staff')->group(function () {
            Route::get('profile', [\App\Http\Controllers\Api\V1\Faculty\ProfileController::class, 'show']);
            Route::put('profile', [\App\Http\Controllers\Api\V1\Faculty\ProfileController::class, 'update']);
            Route::post('profile/photo',   [\App\Http\Controllers\Api\V1\ProfilePhotoController::class, 'upload']);
            Route::delete('profile/photo', [\App\Http\Controllers\Api\V1\ProfilePhotoController::class, 'destroy']);

            Route::get('appointments', [StudentAppointmentController::class, 'index']);
            Route::post('appointments', [StudentAppointmentController::class, 'store']);
            Route::post('appointments/{appointment}/cancel', [StudentAppointmentController::class, 'cancel']);
            Route::get('appointment-slots', [StudentAppointmentController::class, 'availableSlots']);

            Route::get('medicines', [StudentMedicineController::class, 'available']);
            Route::get('medicine-requests', [StudentMedicineController::class, 'myRequests']);
            Route::post('medicine-requests', [StudentMedicineController::class, 'request']);

            Route::get('survey/questions', [StudentSurveyController::class, 'questions']);
            Route::get('survey/my-answers', [StudentSurveyController::class, 'myAnswers']);
            Route::post('survey/submit', [StudentSurveyController::class, 'submit']);

            Route::get('requirements', [StudentRequirementController::class, 'myStatus']);
            Route::post('requirements/upload', [StudentRequirementController::class, 'upload']);
        });

        // Messaging (student + faculty + admin + superadmin)
        Route::prefix('messages')->middleware('role:student,faculty_staff,admin,super_admin')->group(function () {
            Route::get('conversations', [AdminMessageController::class, 'conversations']);
            Route::post('conversations', [AdminMessageController::class, 'startConversation']);
            Route::get('conversations/{conversation}', [AdminMessageController::class, 'showConversation']);
            Route::post('conversations/{conversation}/messages', [AdminMessageController::class, 'sendMessage']);
            Route::post('conversations/{conversation}/read', [AdminMessageController::class, 'markRead']);
        });

        // ==========================================
        // ADMIN ROUTES
        // ==========================================
        Route::prefix('admin')->middleware('role:admin,super_admin')->group(function () {

            // Dashboard
            Route::get('dashboard/stats', [DashboardController::class, 'stats']);
            Route::get('dashboard/appointments-chart', [DashboardController::class, 'appointmentChart']);
            Route::get('dashboard/medicine-chart', [DashboardController::class, 'medicineChart']);
            Route::get('dashboard/program-distribution', [DashboardController::class, 'programDistribution']);
            Route::get('dashboard/pregnancy-stats', [DashboardController::class, 'pregnancyStats']);

            // User Management
            Route::get('users', [AdminUserController::class, 'index']);
            Route::get('users/{user}', [AdminUserController::class, 'show']);
            Route::post('users', [AdminUserController::class, 'store']);
            Route::put('users/{user}', [AdminUserController::class, 'update']);
            Route::delete('users/{user}', [AdminUserController::class, 'destroy']);
            Route::post('users/bulk-import', [AdminUserController::class, 'bulkImport']);
            Route::post('users/{user}/toggle-active', [AdminUserController::class, 'toggleActive']);

            // Programs
            Route::get('programs', [ProgramController::class, 'index']);
            Route::post('programs', [ProgramController::class, 'store']);
            Route::put('programs/{program}', [ProgramController::class, 'update']);
            Route::delete('programs/{program}', [ProgramController::class, 'destroy']);

            // Faculty / Staff
            Route::get('faculty', [\App\Http\Controllers\Api\V1\Admin\FacultyController::class, 'index']);

            // Appointment Slots
            Route::get('appointment-slots', [AdminAppointmentController::class, 'indexSlots']);
            Route::post('appointment-slots', [AdminAppointmentController::class, 'storeSlot']);
            Route::put('appointment-slots/{slot}', [AdminAppointmentController::class, 'updateSlot']);
            Route::delete('appointment-slots/{slot}', [AdminAppointmentController::class, 'destroySlot']);

            // Appointments
            Route::get('appointments', [AdminAppointmentController::class, 'index']);
            Route::get('appointments/calendar', [AdminAppointmentController::class, 'calendar']);
            Route::get('appointments/stats', [AdminAppointmentController::class, 'stats']);
            Route::get('appointments/{appointment}', [AdminAppointmentController::class, 'show']);
            Route::post('appointments/{appointment}/approve', [AdminAppointmentController::class, 'approve']);
            Route::post('appointments/{appointment}/decline', [AdminAppointmentController::class, 'decline']);
            Route::post('appointments/{appointment}/complete', [AdminAppointmentController::class, 'complete']);

            // Medicine Inventory
            Route::get('medicines', [AdminMedicineController::class, 'index']);
            Route::get('medicines/low-stock', [AdminMedicineController::class, 'lowStock']);
            Route::get('medicines/out-of-stock', [AdminMedicineController::class, 'outOfStock']);
            Route::post('medicines', [AdminMedicineController::class, 'store']);
            Route::get('medicines/{medicine}', [AdminMedicineController::class, 'show']);
            Route::put('medicines/{medicine}', [AdminMedicineController::class, 'update']);
            Route::delete('medicines/{medicine}', [AdminMedicineController::class, 'destroy']);

            // Medicine Requests
            Route::get('medicine-requests', [AdminMedicineController::class, 'requests']);
            Route::post('medicine-requests/{medicineRequest}/approve', [AdminMedicineController::class, 'approveRequest']);
            Route::post('medicine-requests/{medicineRequest}/reject', [AdminMedicineController::class, 'rejectRequest']);
            Route::post('medicine-requests/{medicineRequest}/release', [AdminMedicineController::class, 'releaseRequest']);

            // Survey Builder
            Route::get('survey/questions', [AdminSurveyController::class, 'index']);
            Route::post('survey/questions', [AdminSurveyController::class, 'store']);
            Route::put('survey/questions/{surveyQuestion}', [AdminSurveyController::class, 'update']);
            Route::delete('survey/questions/{surveyQuestion}', [AdminSurveyController::class, 'destroy']);
            Route::post('survey/questions/reorder', [AdminSurveyController::class, 'reorder']);
            Route::get('survey/responses', [AdminSurveyController::class, 'responses']);

            // Medical Requirements
            Route::get('requirement-types', [AdminRequirementController::class, 'indexTypes']);
            Route::post('requirement-types', [AdminRequirementController::class, 'storeType']);
            Route::put('requirement-types/{requirementType}', [AdminRequirementController::class, 'updateType']);
            Route::delete('requirement-types/{requirementType}', [AdminRequirementController::class, 'destroyType']);
            Route::get('user-requirements', [AdminRequirementController::class, 'userRequirements']);
            Route::post('user-requirements/{userRequirement}/review', [AdminRequirementController::class, 'review']);
            Route::post('user-requirements/clear-submissions', [AdminRequirementController::class, 'clearSubmissions'])
                ->middleware('role:super_admin');

            // Announcements
            Route::get('announcements', [AdminAnnouncementController::class, 'index']);
            Route::get('announcements/{announcement}', [AdminAnnouncementController::class, 'show']);
            Route::post('announcements', [AdminAnnouncementController::class, 'store']);
            Route::put('announcements/{announcement}', [AdminAnnouncementController::class, 'update']);
            Route::delete('announcements/{announcement}', [AdminAnnouncementController::class, 'destroy']);

            // Reports
            Route::get('reports', [ReportController::class, 'index']);
            Route::post('reports/generate', [ReportController::class, 'generate']);
            Route::get('reports/{report}', [ReportController::class, 'show']);
            Route::get('reports/{report}/download', [ReportController::class, 'download']);

            // Audit Logs (SuperAdmin only)
            Route::get('audit-logs', fn(Request $req) => response()->json([
                'data' => \App\Models\AuditLog::with('user:id,name,email')
                    ->when($req->user_id, fn($q) => $q->where('user_id', $req->user_id))
                    ->when($req->action,  fn($q) => $q->where('action', $req->action))
                    ->latest()->paginate(50),
            ]))->middleware('role:super_admin');
        });
    });
});

// NOTE: The following additional routes extend the base api.php above.
// In production, merge these into the main Route::middleware(['auth:sanctum','active','password.changed']) block.

// Additional admin profile + audit routes (append inside admin middleware group)
// Route::get('admin/profile',              [AdminProfileController::class, 'show']);
// Route::put('admin/profile',              [AdminProfileController::class, 'update']);
// Route::post('admin/profile/photo',       [AdminProfileController::class, 'uploadPhoto']);
// Route::delete('admin/profile/photo',     [AdminProfileController::class, 'deletePhoto']);
// Route::get('admin/audit-logs',           [AuditLogController::class, 'index'])->middleware('role:super_admin');
// Route::get('admin/audit-logs/{log}',     [AuditLogController::class, 'show'])->middleware('role:super_admin');
