<?php

use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        attributes: ['middleware' => ['web', 'auth']],
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role'             => RoleMiddleware::class,
            'active'           => EnsureUserIsActive::class,
            'password.changed' => EnsurePasswordChanged::class,
            'survey.completed' => \App\Http\Middleware\EnsureSurveyCompleted::class,
            'profile.completed' => \App\Http\Middleware\EnsureProfileCompleted::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Not found.'], 404);
            }
        });

        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
            }
        });

        // The 'throttle:5,1' middleware on the login/forgot-password/reset-password
        // POST routes fires before AuthController runs, so without this it renders
        // Laravel's raw 429 Blade page instead of redirecting back into the Inertia app.
        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Too many requests. Please wait a moment and try again.'], 429);
            }

            $retryAfter = (int) ($e->getHeaders()['Retry-After'] ?? 60);

            if ($request->routeIs('login.store')) {
                return redirect()->route('login')
                    ->withInput($request->only('email'))
                    ->withErrors(['email' => 'Too many login attempts. Please wait a moment and try again.'])
                    ->with('lockout_seconds', $retryAfter);
            }

            return back()
                ->withInput($request->except('password', 'password_confirmation'))
                ->withErrors(['email' => 'Too many attempts. Please wait a moment and try again.']);
        });
    })->create();