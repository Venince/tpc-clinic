<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Faculty;
use App\Http\Controllers\Student;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Public ────────────────────────────────────────────────────────────────
Route::get('/', function () {
    return Inertia::render('Public/Home', [
        'announcements' => \App\Models\Announcement::published()
            ->notExpired()
            ->latest('published_at')
            ->take(3)
            ->get(['id','title','content','category','published_at']),
        'services'      => \App\Models\ClinicService::active()->get(),
        'facilityPhoto' => \App\Models\Setting::get('facility_photo'),  // ← add
    ]);
})->name('home');

Route::get('/announcements', function () {
    return Inertia::render('Public/Announcements', [
        'announcements' => \App\Models\Announcement::published()
            ->notExpired()
            ->latest('published_at')
            ->paginate(12, ['id','title','content','category','published_at']),
    ]);
})->name('announcements');

// ─── Auth ──────────────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/tpc_login',         [AuthController::class, 'showLogin'])->name('login');
    Route::post('/tpc_login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login.store');
    Route::get('/forgot-password',  [AuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('password.email');
    Route::get('/reset-password/{token}',  [AuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('/reset-password',         [AuthController::class, 'resetPassword'])->name('password.update');
});

Route::middleware(['auth', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Force password change
    Route::get('/change-password',  [AuthController::class, 'showChangePassword'])->name('password.change');
    Route::post('/change-password', [AuthController::class, 'changePassword'])->name('password.change.update');

    // ─── Admin ─────────────────────────────────────────────────────────────
    Route::middleware(['role:admin,super_admin', 'password.changed'])
        ->prefix('admin')->name('admin.')->group(function () {

        Route::get('/dashboard', [Admin\DashboardController::class, 'index'])->name('dashboard');

        // Users
        Route::get('/users',              [Admin\UserController::class, 'index'])->name('users.index');
        Route::get('/users/create',       [Admin\UserController::class, 'create'])->name('users.create');
        Route::get('/users/import',       [Admin\UserController::class, 'importForm'])->name('users.import');
        Route::post('/users/bulk-import', [Admin\UserController::class, 'bulkImport'])->name('users.import.store'); 
        Route::post('/users',             [Admin\UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit',  [Admin\UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}',       [Admin\UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}',    [Admin\UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/users/{user}/toggle-active', [Admin\UserController::class, 'toggleActive'])->name('users.toggle');

        // Programs
        Route::get('/programs',          [Admin\ProgramController::class, 'index'])->name('programs.index');
        Route::post('/programs',         [Admin\ProgramController::class, 'store'])->name('programs.store');
        Route::put('/programs/{program}',[Admin\ProgramController::class, 'update'])->name('programs.update');
        Route::delete('/programs/{program}', [Admin\ProgramController::class, 'destroy'])->name('programs.destroy');

        // Appointments
        Route::get('/appointments',          [Admin\AppointmentController::class, 'index'])->name('appointments.index');
        Route::get('/appointments/calendar', [Admin\AppointmentController::class, 'calendar'])->name('appointments.calendar');
        Route::post('/appointment-slots',    [Admin\AppointmentController::class, 'slotStore'])->name('slots.store');
        Route::delete('/appointment-slots/{slot}', [Admin\AppointmentController::class, 'slotDestroy'])->name('slots.destroy');
        Route::post('/appointments/{appointment}/approve',  [Admin\AppointmentController::class, 'approve'])->name('appointments.approve');
        Route::post('/appointments/{appointment}/decline',  [Admin\AppointmentController::class, 'decline'])->name('appointments.decline');
        Route::post('/appointments/{appointment}/complete', [Admin\AppointmentController::class, 'complete'])->name('appointments.complete');
        Route::delete('/appointments/{appointment}', [Admin\AppointmentController::class, 'destroyAppointment'])->name('appointments.destroy');

        // Medicine
        Route::get('/medicine',            [Admin\MedicineController::class, 'index'])->name('medicine.index');
        Route::post('/medicine',           [Admin\MedicineController::class, 'store'])->name('medicine.store');
        Route::put('/medicine/{medicine}', [Admin\MedicineController::class, 'update'])->name('medicine.update');
        Route::delete('/medicine/{medicine}', [Admin\MedicineController::class, 'destroy'])->name('medicine.destroy');
        Route::get('/medicine-requests',   [Admin\MedicineController::class, 'requests'])->name('medicine.requests');
        Route::post('/medicine-requests/{medicineRequest}/approve', [Admin\MedicineController::class, 'approveRequest'])->name('medicine.requests.approve');
        Route::post('/medicine-requests/{medicineRequest}/reject',  [Admin\MedicineController::class, 'rejectRequest'])->name('medicine.requests.reject');
        Route::post('/medicine-requests/{medicineRequest}/release', [Admin\MedicineController::class, 'releaseRequest'])->name('medicine.requests.release');
        Route::delete('/medicine-requests/{medicineRequest}', [Admin\MedicineController::class, 'destroyRequest'])->name('medicine.requests.destroy');

        // Survey
        Route::get('/survey',                    [Admin\SurveyController::class, 'index'])->name('survey.index');
        Route::post('/survey',                   [Admin\SurveyController::class, 'store'])->name('survey.store');
        Route::put('/survey/{surveyQuestion}',   [Admin\SurveyController::class, 'update'])->name('survey.update');
        Route::delete('/survey/{surveyQuestion}',[Admin\SurveyController::class, 'destroy'])->name('survey.destroy');
        Route::post('/survey/reorder',           [Admin\SurveyController::class, 'reorder'])->name('survey.reorder');

        // Requirements
        Route::get('/requirements',              [Admin\RequirementController::class, 'index'])->name('requirements.index');
        Route::get('/requirements/{userRequirement}/file', [Admin\RequirementController::class, 'streamFile'])
            ->name('requirements.file');
        Route::post('/requirements/types',       [Admin\RequirementController::class, 'storeType'])->name('requirements.types.store');
        Route::delete('/requirements/types/{requirementType}', [Admin\RequirementController::class, 'destroyType'])->name('requirements.types.destroy');
        Route::post('/requirements/{userRequirement}/review', [Admin\RequirementController::class, 'review'])->name('requirements.review');
        Route::post('/requirements/clear-submissions', [Admin\RequirementController::class, 'clearSubmissions'])
            ->name('requirements.clear-submissions')
            ->middleware('role:super_admin');

        // Announcements
        Route::get('/announcements',                    [Admin\AnnouncementController::class, 'index'])->name('announcements.index');
        Route::post('/announcements',                   [Admin\AnnouncementController::class, 'store'])->name('announcements.store');
        Route::put('/announcements/{announcement}',     [Admin\AnnouncementController::class, 'update'])->name('announcements.update');
        Route::delete('/announcements/{announcement}',  [Admin\AnnouncementController::class, 'destroy'])->name('announcements.destroy');

        // Messages
        Route::get('/messages',                      [Admin\MessageController::class, 'index'])->name('messages.index');
        Route::post('/messages',                     [Admin\MessageController::class, 'store'])->name('messages.store');
        Route::get('/messages/{conversation}',       [Admin\MessageController::class, 'show'])->name('messages.show');
        Route::post('/messages/{conversation}/reply',[Admin\MessageController::class, 'reply'])->name('messages.reply');

        // Reports
        Route::get('/reports',                   [Admin\ReportController::class, 'index'])->name('reports.index');
        Route::post('/reports',                  [Admin\ReportController::class, 'store'])->name('reports.store');
        Route::get('/reports/{report}/download', [Admin\ReportController::class, 'download'])->name('reports.download');
        Route::delete('/reports/{report}',       [Admin\ReportController::class, 'destroy'])->name('reports.destroy'); 

        // Notifications
        Route::get('/notifications', fn(\Illuminate\Http\Request $r) => Inertia::render('Admin/Notifications', [
            'notifications' => $r->user()->notifications()->paginate(20),
        ]))->name('notifications');
        Route::post('/notifications/{id}/read', function(\Illuminate\Http\Request $r, $id) {
            $r->user()->notifications()->find($id)?->markAsRead();
            return back();
        })->name('notifications.read');
        Route::post('/notifications/read-all', function(\Illuminate\Http\Request $r) {
            $r->user()->unreadNotifications->markAsRead();
            return back()->with('success','All notifications marked as read.');
        })->name('notifications.readAll');
        Route::get('/faculty', function () {
            $faculty = \App\Models\FacultyProfile::with('user')->orderBy('id')->get();
            return inertia('Admin/Faculty/Index', ['faculty' => $faculty]);
        })->name('faculty.index');

        // Clinic Services
        Route::post('/services',              [\App\Http\Controllers\Admin\ClinicServiceController::class, 'store'])->name('services.store');
        Route::put('/services/{clinicService}',   [\App\Http\Controllers\Admin\ClinicServiceController::class, 'update'])->name('services.update');
        Route::delete('/services/{clinicService}',[\App\Http\Controllers\Admin\ClinicServiceController::class, 'destroy'])->name('services.destroy');

        // Settings
        Route::post('/settings/facility-photo', function (\Illuminate\Http\Request $request) {
            $request->validate(['photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:3072']);

            $old = \App\Models\Setting::get('facility_photo');
            if ($old) \Illuminate\Support\Facades\Storage::disk('public')->delete($old);

            $path = $request->file('photo')->store('facility', 'public');
            \App\Models\Setting::set('facility_photo', $path);

            return back()->with('success', 'Facility photo updated.');
        })->name('settings.facility-photo');
    });

    // ─── Student ───────────────────────────────────────────────────────────
    Route::middleware(['role:student', 'password.changed'])
        ->prefix('student')->name('student.')->group(function () {

        // Always accessible — no survey gate
        Route::get('/dashboard',  [Student\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/profile',    [Student\ProfileController::class,  'show'])->name('profile');
        Route::put('/profile',    [Student\ProfileController::class,  'update'])->name('profile.update');
        Route::get('/survey',     [Student\SurveyController::class,   'index'])->name('survey.index');
        Route::post('/survey',    [Student\SurveyController::class,   'submit'])->name('survey.submit');

        // Notification routes — no gate needed
        Route::get('/notifications', fn(\Illuminate\Http\Request $r) => Inertia::render('Student/Notifications', [
            'notifications' => $r->user()->notifications()->paginate(20),
        ]))->name('notifications');
        Route::post('/notifications/{id}/read', function(\Illuminate\Http\Request $r, $id) {
            $r->user()->notifications()->find($id)?->markAsRead();
            return back();
        })->name('notifications.read');
        Route::post('/notifications/read-all', function(\Illuminate\Http\Request $r) {
            $r->user()->unreadNotifications->markAsRead();
            return back()->with('success', 'All notifications marked as read.');
        })->name('notifications.readAll');

        // Gated — requires survey completion
        Route::middleware('survey.completed')->group(function () {
            Route::get('/appointments',         [Student\AppointmentController::class, 'index'])->name('appointments.index');
            Route::post('/appointments',        [Student\AppointmentController::class, 'store'])->name('appointments.store');
            Route::post('/appointments/{appointment}/cancel', [Student\AppointmentController::class, 'cancel'])->name('appointments.cancel');

            Route::get('/medicine',  [Student\MedicineController::class, 'index'])->name('medicine.index');
            Route::post('/medicine', [Student\MedicineController::class, 'store'])->name('medicine.store');
            Route::post('/medicine/{medicineRequest}/cancel', [Student\MedicineController::class, 'cancel'])->name('medicine.cancel');

            Route::get('/requirements',         [Student\RequirementController::class, 'index'])->name('requirements.index');
            Route::post('/requirements/upload', [Student\RequirementController::class, 'upload'])->name('requirements.upload');

            Route::get('/messages',                        [Admin\MessageController::class, 'index'])->name('messages.index');
            Route::post('/messages',                       [Admin\MessageController::class, 'store'])->name('messages.store');
            Route::get('/messages/{conversation}',         [Admin\MessageController::class, 'show'])->name('messages.show');
            Route::post('/messages/{conversation}/reply',  [Admin\MessageController::class, 'reply'])->name('messages.reply');
        });
    });

    // ─── Faculty ───────────────────────────────────────────────────────────
    Route::middleware(['role:faculty_staff', 'password.changed'])
        ->prefix('faculty')->name('faculty.')->group(function () {

        Route::get('/dashboard', [Faculty\DashboardController::class, 'index'])->name('dashboard');

        // Faculty re-uses student controllers for most features
        Route::get('/appointments',        [Student\AppointmentController::class, 'index'])->name('appointments.index');
        Route::post('/appointments',       [Student\AppointmentController::class, 'store'])->name('appointments.store');
        Route::post('/appointments/{appointment}/cancel', [Student\AppointmentController::class, 'cancel'])->name('appointments.cancel');

        Route::get('/medicine',  [Student\MedicineController::class, 'index'])->name('medicine.index');
        Route::post('/medicine', [Student\MedicineController::class, 'store'])->name('medicine.store');
        Route::post('/medicine/{medicineRequest}/cancel', [Student\MedicineController::class, 'cancel'])->name('medicine.cancel');

        Route::get('/survey',    [Student\SurveyController::class, 'index'])->name('survey.index');
        Route::post('/survey',   [Student\SurveyController::class, 'submit'])->name('survey.submit');

        Route::get('/requirements',         [Student\RequirementController::class, 'index'])->name('requirements.index');
        Route::post('/requirements/upload', [Student\RequirementController::class, 'upload'])->name('requirements.upload');

        Route::get('/messages',                        [Admin\MessageController::class, 'index'])->name('messages.index');
        Route::post('/messages',                       [Admin\MessageController::class, 'store'])->name('messages.store');
        Route::get('/messages/{conversation}',         [Admin\MessageController::class, 'show'])->name('messages.show');
        Route::post('/messages/{conversation}/reply',  [Admin\MessageController::class, 'reply'])->name('messages.reply');

        Route::get('/notifications', fn(\Illuminate\Http\Request $r) => Inertia::render('Faculty/Notifications', [
            'notifications' => $r->user()->notifications()->paginate(20),
        ]))->name('notifications');
        Route::post('/notifications/{id}/read', function(\Illuminate\Http\Request $r, $id) {
            $r->user()->notifications()->find($id)?->markAsRead();
            return back();
        })->name('notifications.read');
        Route::post('/notifications/read-all', function(\Illuminate\Http\Request $r) {
            $r->user()->unreadNotifications->markAsRead();
            return back()->with('success', 'All notifications marked as read.');
        })->name('notifications.readAll');

        Route::get('/profile',  [Faculty\ProfileController::class, 'show'])->name('profile');
        Route::put('/profile',  [Faculty\ProfileController::class, 'update'])->name('profile.update');
    });
});
