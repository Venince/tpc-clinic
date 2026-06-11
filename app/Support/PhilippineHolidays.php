<?php

namespace App\Support;

use Carbon\Carbon;

class PhilippineHolidays
{
    /**
     * Fixed-date regular and special non-working holidays.
     * Format: 'm-d' => 'Holiday Name'
     */
    private const FIXED_HOLIDAYS = [
        '01-01' => "New Year's Day",
        '04-09' => 'Araw ng Kagitingan',
        '05-01' => 'Labor Day',
        '06-12' => 'Independence Day',
        '08-21' => 'Ninoy Aquino Day',
        '11-01' => "All Saints' Day",
        '11-02' => "All Souls' Day",
        '11-30' => 'Bonifacio Day',
        '12-08' => 'Feast of the Immaculate Conception',
        '12-24' => 'Christmas Eve',
        '12-25' => 'Christmas Day',
        '12-30' => 'Rizal Day',
        '12-31' => "New Year's Eve",
    ];

    /**
     * Movable holidays per year (e.g. Holy Week, Eid dates, EDSA-declared dates).
     * These shift every year and ideally should be confirmed/updated annually
     * via Malacañang proclamations. Add entries as needed.
     *
     * Format: 'Y-m-d' => 'Holiday Name'
     */
    private const MOVABLE_HOLIDAYS = [
        // 2026 (approximate / to be confirmed against official proclamation)
        '2026-02-25' => 'EDSA People Power Revolution Anniversary',
        '2026-04-02' => 'Maundy Thursday',
        '2026-04-03' => 'Good Friday',
        '2026-04-04' => 'Black Saturday',
        '2026-08-31' => 'National Heroes Day',
    ];

    /**
     * Check if a given date is a Philippine holiday (fixed or movable).
     */
    public static function isHoliday(string|Carbon $date): bool
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);

        if (isset(self::MOVABLE_HOLIDAYS[$date->format('Y-m-d')])) {
            return true;
        }

        return isset(self::FIXED_HOLIDAYS[$date->format('m-d')]);
    }

    /**
     * Get the holiday name for a given date, if any.
     */
    public static function getHolidayName(string|Carbon $date): ?string
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);

        return self::MOVABLE_HOLIDAYS[$date->format('Y-m-d')]
            ?? self::FIXED_HOLIDAYS[$date->format('m-d')]
            ?? null;
    }

    /**
     * Check if a given date is a weekend (Saturday or Sunday).
     */
    public static function isWeekend(string|Carbon $date): bool
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);

        return $date->isWeekend();
    }

    /**
     * Check if a date is bookable for appointment slots
     * (i.e. not a weekend and not a holiday).
     */
    public static function isAvailableForSlots(string|Carbon $date): bool
    {
        return !self::isWeekend($date) && !self::isHoliday($date);
    }

    /**
     * Get a human-readable reason why a date is unavailable, or null if available.
     */
    public static function unavailableReason(string|Carbon $date): ?string
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);

        if (self::isWeekend($date)) {
            return 'weekends are not available for appointment slots.';
        }

        if ($holiday = self::getHolidayName($date)) {
            return "{$holiday} is a holiday and not available for appointment slots.";
        }

        return null;
    }

    /**
     * Get all holidays for a given year as ['date' => 'Y-m-d', 'name' => string].
     * Useful for exposing to the frontend (e.g. to disable dates in a date picker).
     */
    public static function getHolidaysForYear(int $year): array
    {
        $holidays = [];

        foreach (self::FIXED_HOLIDAYS as $md => $name) {
            $holidays[] = [
                'date' => "{$year}-{$md}",
                'name' => $name,
            ];
        }

        foreach (self::MOVABLE_HOLIDAYS as $date => $name) {
            if (str_starts_with($date, (string) $year)) {
                $holidays[] = [
                    'date' => $date,
                    'name' => $name,
                ];
            }
        }

        usort($holidays, fn($a, $b) => $a['date'] <=> $b['date']);

        return $holidays;
    }
}