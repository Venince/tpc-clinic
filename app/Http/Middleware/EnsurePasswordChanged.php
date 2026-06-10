<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;

class EnsurePasswordChanged {
    public function handle(Request $request, Closure $next) {
        if ($request->user()?->force_password_change && !$request->routeIs('password.change*')) {
            return redirect()->route('password.change');
        }
        return $next($request);
    }
}
