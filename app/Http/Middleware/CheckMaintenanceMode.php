<?php

namespace App\Http\Middleware;

use App\Support\Maintenance;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    /** Web pages a signed-in non-admin can still open during maintenance. */
    private const ALLOWED_ROUTES = ['home', 'announcements', 'privacy-policy', 'logout'];

    public function handle(Request $request, Closure $next): Response
    {
        if (!Maintenance::isOn()) {
            return $next($request);
        }

        $user = $request->user() ?? ($request->bearerToken() ? $request->user('sanctum') : null);

        // Guests are never blocked here: the auth middleware sends them to the login
        // page, and login itself refuses non-admins. Admins always pass.
        if (!$user || $user->isAdminOrHigher()) {
            return $next($request);
        }

        if ($request->routeIs(...self::ALLOWED_ROUTES) || $request->is('api/v1/auth/logout', 'api/v1/public/*')) {
            return $next($request);
        }

        return $this->maintenanceResponse($request);
    }

    private function maintenanceResponse(Request $request): Response
    {
        $state   = Maintenance::state();
        $headers = [];

        if ($retryAfter = Maintenance::retryAfterSeconds()) {
            $headers['Retry-After'] = (string) $retryAfter;
        }

        // API clients get JSON. Inertia visits (X-Inertia) always get the Inertia page.
        if (!$request->header('X-Inertia') && ($request->is('api/*') || $request->expectsJson())) {
            return response()->json([
                'message' => $state['message'] ?: 'The system is under maintenance. Please try again later.',
                'ends_at' => $state['ends_at'],
            ], 503, $headers);
        }

        $response = Inertia::render('Maintenance', [
            'message' => $state['message'],
            'ends_at' => $state['ends_at'],
        ])->toResponse($request)->setStatusCode(503);

        $response->headers->add($headers);

        return $response;
    }
}