<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\Maintenance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MaintenanceController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Maintenance/Index', [
            // Named "settings" (not "maintenance") so it doesn't shadow the shared prop.
            'settings' => Maintenance::state(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'message' => ['nullable', 'string', 'max:255'],
            'ends_at' => ['nullable', 'date'],
        ]);

        $wasOn = Maintenance::isOn();

        Maintenance::save((bool) $data['enabled'], $data['message'] ?? null, $data['ends_at'] ?? null);

        if ($wasOn !== (bool) $data['enabled']) {
            AuditLog::create([
                'user_id'    => $request->user()->id,
                'action'     => $data['enabled'] ? 'maintenance_enabled' : 'maintenance_disabled',
                'ip_address' => $request->ip(),
            ]);
        }

        return back()->with('success', $data['enabled'] ? 'Maintenance mode is now ON.' : 'Maintenance mode is now OFF.');
    }
}