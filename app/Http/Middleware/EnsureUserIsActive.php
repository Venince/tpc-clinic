<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;

class EnsureUserIsActive {
    public function handle(Request $request, Closure $next) {
        if ($request->user() && !$request->user()->is_active) {
            auth()->logout();
            return redirect()->route('login')->with('error', 'Your account has been deactivated.');
        }
        return $next($request);
    }
}
