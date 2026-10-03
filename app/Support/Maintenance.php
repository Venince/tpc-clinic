<?php

namespace App\Support;

use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * Single source of truth for maintenance mode.
 *
 * State lives in the existing `settings` table (one short key per value) and is
 * cached, so the per-request check costs a cache read instead of DB queries.
 */
class Maintenance
{
  private const CACHE_KEY = 'maintenance_state';

  public static function state(): array
  {
    return Cache::rememberForever(self::CACHE_KEY, fn() => [
      'enabled' => Setting::get('maintenance_enabled', '0') === '1',
      'message' => Setting::get('maintenance_message') ?: null,
      'ends_at' => Setting::get('maintenance_ends_at') ?: null,
      'enabled_at' => Setting::get('maintenance_enabled_at') ?: null,
    ]);
  }

  /** What gets shared with every Inertia page (no internal fields). */
  public static function publicState(): array
  {
    $s = self::state();

    return [
      'enabled' => $s['enabled'],
      'message' => $s['message'],
      'ends_at' => $s['ends_at'],
    ];
  }

  public static function isOn(): bool
  {
    return self::state()['enabled'];
  }

  /** Admins and super admins are never blocked. */
  public static function blocksUser(?User $user): bool
  {
    return $user !== null && self::isOn() && !$user->isAdminOrHigher();
  }

  public static function save(bool $enabled, ?string $message, ?string $endsAt): array
  {
    $previous = self::state();

    $enabledAt = $enabled
      ? ($previous['enabled'] && $previous['enabled_at'] ? $previous['enabled_at'] : now()->toIso8601String())
      : '';

    Setting::set('maintenance_enabled', $enabled ? '1' : '0');
    Setting::set('maintenance_message', $message ? trim($message) : '');
    Setting::set('maintenance_ends_at', $endsAt ? Carbon::parse($endsAt)->format('Y-m-d\TH:i') : '');
    Setting::set('maintenance_enabled_at', $enabledAt);

    Cache::forget(self::CACHE_KEY);

    return self::state();
  }

  /** Seconds until the expected end time, or null if unset / already past. */
  public static function retryAfterSeconds(): ?int
  {
    $endsAt = self::state()['ends_at'];
    if (!$endsAt)
      return null;

    $seconds = (int) now()->diffInSeconds(Carbon::parse($endsAt), false);

    return $seconds > 0 ? $seconds : null;
  }

  /** Plain-text message used when a non-admin tries to sign in. */
  public static function loginMessage(): string
  {
    $s = self::state();
    $msg = $s['message'] ?: 'TPC e-Clinic is under maintenance. Please try again later.';

    if ($s['ends_at']) {
      $msg .= ' Expected back: ' . Carbon::parse($s['ends_at'])->format('M j, Y g:i A') . '.';
    }

    return $msg;
  }
}